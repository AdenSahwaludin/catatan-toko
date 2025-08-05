<template>
  <div class="sales-chart">
    <!-- Loading State -->
    <div v-if="loading" class="chart-loading">
      <v-progress-circular indeterminate color="primary" size="48" />
      <div class="text-subtitle-1 mt-3">Loading chart data...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="chart-error">
      <v-icon size="48" color="error" class="mb-3">mdi-alert-circle</v-icon>
      <div class="text-subtitle-1 mb-2">Failed to load chart</div>
      <div class="text-caption text-medium-emphasis">{{ error }}</div>
      <v-btn
        color="primary"
        variant="outlined"
        size="small"
        @click="$emit('refresh')"
        class="mt-3"
      >
        <v-icon start>mdi-refresh</v-icon>
        Retry
      </v-btn>
    </div>

    <!-- No Data State -->
    <div v-else-if="!hasValidData" class="chart-empty">
      <v-icon size="48" color="grey-lighten-2" class="mb-3">mdi-chart-line</v-icon>
      <div class="text-subtitle-1 mb-2">No Sales Data</div>
      <div class="text-caption text-medium-emphasis">
        {{ salesData?.length 
           ? `No sales found for the selected ${period} period` 
           : "Start recording sales to see chart data" 
        }}
      </div>
    </div>

    <!-- Chart with Data -->
    <div v-else class="chart-container">
      <!-- Statistics Summary -->
      <div class="chart-stats mb-4">
        <v-row dense>
          <v-col cols="6" sm="3">
            <div class="stat-item">
              <div class="stat-value">{{ formatCurrency(periodStats.totalRevenue) }}</div>
              <div class="stat-label">Total Revenue</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="stat-item">
              <div class="stat-value">{{ periodStats.totalTransactions }}</div>
              <div class="stat-label">Transactions</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="stat-item">
              <div class="stat-value">{{ formatCurrency(periodStats.averageTransaction) }}</div>
              <div class="stat-label">Avg. Sale</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="stat-item">
              <div class="stat-value">
                <v-icon 
                  :color="periodStats.growth >= 0 ? 'success' : 'error'" 
                  size="14" 
                  class="mr-1"
                >
                  {{ periodStats.growth >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
                </v-icon>
                {{ Math.abs(periodStats.growth).toFixed(1) }}%
              </div>
              <div class="stat-label">Growth</div>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- Chart Canvas -->
      <div class="chart-wrapper">
        <canvas 
          ref="chartCanvas" 
          :width="800"
          :height="height"
          :style="{ 
            visibility: isCreatingChart ? 'hidden' : 'visible',
            width: '100%',
            height: height + 'px',
            display: 'block'
          }"
        ></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
);

const props = defineProps({
  salesData: {
    type: Array,
    default: () => []
  },
  period: {
    type: String,
    default: 'month'
  },
  height: {
    type: Number,
    default: 300
  }
});

const emit = defineEmits(['refresh']);

const chartCanvas = ref(null);
const chart = ref(null);
const loading = ref(false);
const error = ref(null);
const isMounted = ref(false);
const isCreatingChart = ref(false);
let resizeObserver = null;

// Check if we have valid data to show
const hasValidData = computed(() => {
  if (!props.salesData || props.salesData.length === 0) return false;
  
  const processed = processedChartData.value;
  return processed.data.some(value => value > 0);
});

// Process sales data for chart display
const processedChartData = computed(() => {
  if (!props.salesData || props.salesData.length === 0) {
    return { labels: [], data: [] };
  }

  try {
    const now = new Date();
    let startDate;
    let labels = [];
    let dataMap = new Map();

    // Generate labels and initialize data based on period
    switch (props.period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const label = date.toLocaleDateString('id-ID', { 
            weekday: 'short', 
            day: 'numeric' 
          });
          labels.push(label);
          dataMap.set(date.toDateString(), 0);
        }
        break;

      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();
        
        // Show days up to current day
        for (let i = 1; i <= Math.min(daysInMonth, currentDay); i++) {
          labels.push(i.toString());
          const date = new Date(now.getFullYear(), now.getMonth(), i);
          dataMap.set(date.toDateString(), 0);
        }
        break;

      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 0; i <= now.getMonth(); i++) {
          labels.push(months[i]);
          const monthKey = `${now.getFullYear()}-${i}`;
          dataMap.set(monthKey, 0);
        }
        break;
    }

    // Aggregate sales data
    props.salesData.forEach(sale => {
      try {
        const saleDate = new Date(sale.created_at);
        if (isNaN(saleDate.getTime())) {
          console.warn('Invalid sale date:', sale.created_at);
          return;
        }

        if (saleDate >= startDate && saleDate <= now) {
          let key;
          
          if (props.period === 'year') {
            key = `${saleDate.getFullYear()}-${saleDate.getMonth()}`;
          } else {
            key = saleDate.toDateString();
          }
          
          if (dataMap.has(key)) {
            const currentTotal = dataMap.get(key);
            const saleTotal = Number(sale.total) || 0;
            dataMap.set(key, currentTotal + saleTotal);
          }
        }
      } catch (dateError) {
        console.warn('Error processing sale date:', sale.created_at, dateError);
      }
    });

    const data = Array.from(dataMap.values());
    
    return { labels, data };
  } catch (err) {
    console.error('Error processing chart data:', err);
    return { labels: [], data: [] };
  }
});

// Calculate period statistics
const periodStats = computed(() => {
  if (!hasValidData.value) {
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      averageTransaction: 0,
      growth: 0
    };
  }

  const { data } = processedChartData.value;
  const totalRevenue = data.reduce((sum, val) => sum + val, 0);
  const totalTransactions = props.salesData.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Calculate growth (compare first half vs second half)
  const midPoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midPoint);
  const secondHalf = data.slice(midPoint);

  const firstHalfAvg = firstHalf.length > 0 
    ? firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length 
    : 0;
  const secondHalfAvg = secondHalf.length > 0 
    ? secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length 
    : 0;

  const growth = firstHalfAvg > 0 
    ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 
    : 0;

  return {
    totalRevenue,
    totalTransactions,
    averageTransaction,
    growth
  };
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const createChart = async () => {
  // Check if component is still mounted and canvas is available
  if (!isMounted.value || !chartCanvas.value) {
    console.warn('Chart creation skipped - component not mounted or canvas unavailable');
    return;
  }

  if (!hasValidData.value) {
    console.log('No valid data for chart');
    return;
  }

  // Prevent multiple concurrent chart creation
  if (isCreatingChart.value) {
    console.log('Chart creation already in progress');
    return;
  }

  isCreatingChart.value = true;

  try {
    // Always destroy existing chart first
    if (chart.value) {
      try {
        chart.value.destroy();
      } catch (destroyError) {
        console.warn('Error destroying existing chart:', destroyError);
      }
      chart.value = null;
    }

    // Wait for DOM to be stable
    await new Promise(resolve => setTimeout(resolve, 50));
    await nextTick();

    // Triple check after delays
    if (!isMounted.value || !chartCanvas.value) {
      console.warn('Chart creation aborted - component state changed after delay');
      return;
    }

    // Ensure canvas has proper dimensions
    const canvas = chartCanvas.value;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn('Canvas has zero dimensions, delaying chart creation');
      setTimeout(() => {
        if (isMounted.value) {
          isCreatingChart.value = false;
          debouncedCreateChart();
        }
      }, 100);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

    // Validate context state
    if (!ctx.canvas || ctx.canvas !== canvas) {
      throw new Error('Invalid canvas context');
    }

    const { labels, data } = processedChartData.value;

    console.log('Creating chart with data:', { 
      labels, 
      data, 
      hasData: data.some(d => d > 0),
      canvasDimensions: { width: rect.width, height: rect.height }
    });

    // Calculate average line
    const nonZeroData = data.filter(val => val > 0);
    const average = nonZeroData.length > 0 
      ? nonZeroData.reduce((sum, val) => sum + val, 0) / nonZeroData.length 
      : 0;
    const averageData = new Array(data.length).fill(average);

    // Create chart with additional safety options
    chart.value = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Daily Sales',
            data,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Average',
            data: averageData,
            borderColor: '#764ba2',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: window.devicePixelRatio || 1,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#667eea',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                if (context.datasetIndex === 0) {
                  return `Sales: ${formatCurrency(context.parsed.y)}`;
                } else {
                  return `Average: ${formatCurrency(context.parsed.y)}`;
                }
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
              drawBorder: false
            },
            ticks: {
              callback: function(value) {
                return formatCurrency(value);
              },
              color: '#666'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#666'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 0, // Disable animation to prevent context issues
          easing: 'linear'
        },
        // Add onResize handler to prevent context issues
        onResize: function(chart, size) {
          console.log('Chart resized:', size);
        }
      }
    });

    console.log('Chart created successfully');
  } catch (err) {
    console.error('Error creating chart:', err);
    error.value = `Failed to create chart: ${err.message}`;
  } finally {
    isCreatingChart.value = false;
  }
};

// Debounced chart creation
let chartCreationTimer = null;
const debouncedCreateChart = () => {
  if (chartCreationTimer) {
    clearTimeout(chartCreationTimer);
  }
  chartCreationTimer = setTimeout(() => {
    if (isMounted.value && chartCanvas.value && hasValidData.value) {
      // Double check canvas is ready
      const rect = chartCanvas.value.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        createChart();
      } else {
        console.log('Canvas not ready, retrying...');
        // Retry after a bit longer delay
        setTimeout(() => {
          if (isMounted.value && chartCanvas.value && hasValidData.value) {
            createChart();
          }
        }, 200);
      }
    }
  }, 200); // Increased delay
};

// Watch for changes
watch([() => props.salesData, () => props.period], () => {
  if (!isMounted.value) return;
  
  error.value = null;
  // Destroy existing chart first
  if (chart.value) {
    chart.value.destroy();
    chart.value = null;
  }
  
  nextTick(() => {
    debouncedCreateChart();
  });
}, { deep: true });

onMounted(() => {
  isMounted.value = true;
  
  // Setup ResizeObserver to monitor canvas size changes
  if (chartCanvas.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && chart.value) {
          console.log('Canvas resized, triggering chart update');
          chart.value.resize();
        }
      }
    });
    resizeObserver.observe(chartCanvas.value);
  }
  
  nextTick(() => {
    debouncedCreateChart();
  });
});

onUnmounted(() => {
  isMounted.value = false;
  
  // Cleanup ResizeObserver
  if (resizeObserver && chartCanvas.value) {
    resizeObserver.unobserve(chartCanvas.value);
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  
  if (chartCreationTimer) {
    clearTimeout(chartCreationTimer);
    chartCreationTimer = null;
  }
  if (chart.value) {
    try {
      chart.value.destroy();
    } catch (destroyError) {
      console.warn('Error destroying chart on unmount:', destroyError);
    }
    chart.value = null;
  }
});
</script>

<style scoped>
.sales-chart {
  width: 100%;
  height: 100%;
}

.chart-loading,
.chart-error,
.chart-empty {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.chart-container {
  width: 100%;
}

.chart-stats {
  background: rgba(102, 126, 234, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-top: 4px;
}

.chart-wrapper {
  position: relative;
  height: 300px;
  width: 100%;
}

/* Dark theme adjustments */
.v-theme--dark .chart-stats {
  background: rgba(102, 126, 234, 0.1);
}

/* Mobile responsive */
@media (max-width: 600px) {
  .chart-stats {
    padding: 12px;
  }

  .stat-value {
    font-size: 1rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .chart-wrapper {
    height: 250px;
  }
}
</style>
