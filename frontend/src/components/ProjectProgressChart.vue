<template>
  <div class="charts-container">
    <div class="line-chart">
      <h2>Project Progression</h2>
      <canvas ref="lineChartCanvas"></canvas>
    </div>
    <div class="pie-chart">
      <h2>Tasks Progression</h2>
      <canvas ref="pieChartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { Chart, registerables } from 'chart.js';
import { useUserStore } from '../store';
import moment from 'moment';

// Enregistrez tous les éléments de Chart.js
Chart.register(...registerables);

const userStore = useUserStore();
const lineChartCanvas = ref(null);
const pieChartCanvas = ref(null);
let lineChartInstance = null;
let pieChartInstance = null;

const getProgressData = (tasks) => {
  if (!tasks || tasks.length === 0) {
    // Return a consistent structure for an empty project
    return {
      lineData: [],
      pieData: { progressPercentage: 0, pieData: [] }
    };
  }

  // Calcul du pourcentage de progression
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status==='completed').length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // Données pour le diagramme circulaire
  const pieData = tasks.map(task => ({
    name: task.taskname,
    duration: moment(task.enddate).diff(moment(task.startdate), 'days'),
    completed: task.status==='completed' ? 1 : 0
  }));

  // Données pour le diagramme de progression de la courbe
  let cumulativeDays = 0;
  const lineData = tasks
    .sort((a, b) => moment(a.startdate).valueOf() - moment(b.startdate).valueOf())
    .map(task => {
      const taskDuration = moment(task.enddate).diff(moment(task.startdate), 'days');
      cumulativeDays += taskDuration;
      return {
        x: moment(task.startdate).format('YYYY-MM-DD'),
        y: task.status === 'completed' ? 1 : 0
      };
    });

  const smoothedLineData = [];
  let completedCount = 0;
  lineData.forEach((point, index) => {
    if (point.y === 1) {
      completedCount++;
    }
    smoothedLineData.push({
      x: point.x,
      y: (completedCount / (index + 1)) * 100
    });
  });

  return {
    lineData: smoothedLineData,
    pieData: { progressPercentage, pieData }
  };
};

const updateCharts = (data) => {
  if (lineChartInstance) lineChartInstance.destroy();
  if (pieChartInstance) pieChartInstance.destroy();

  const labels = data.lineData.map(d => d.x);
  const values = data.lineData.map(d => d.y);

  // Diagramme de progression (courbe)
  lineChartInstance = new Chart(lineChartCanvas.value, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Progression du Projet',
        data: values,
        borderColor: '#004581',
        tension: 0.4,
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Pourcentage de Progression (%)' }
        },
        x: {
          title: { display: true, text: 'Date' }
        }
      }
    }
  });

  // Diagramme circulaire
  const totalDuration = data.pieData.pieData.reduce((sum, task) => sum + task.duration, 0);
  const pieLabels = data.pieData.pieData.map(t => t.name);
  const pieDurations = data.pieData.pieData.map(t => t.duration);
  const pieColors = pieDurations.map(() => `hsl(${Math.random() * 360}, 70%, 50%)`);

  pieChartInstance = new Chart(pieChartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: pieLabels,
      datasets: [{
        data: pieDurations,
        backgroundColor: pieColors,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      cutout: '70%',
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed;
              const percentage = ((value / totalDuration) * 100).toFixed(2) + '%';
              return `${label}: ${percentage}`;
            }
          }
        }
      }
    }
  });
};

// Observez les changements dans le projet courant
watch(() => userStore.currentProject, (newProject) => {
  const data = getProgressData(newProject.tasks);
  updateCharts(data);
}, { deep: true });

onMounted(() => {
  if (userStore.currentProject.tasks) {
    const data = getProgressData(userStore.currentProject.tasks);
    updateCharts(data);
  }
});
</script>

<style scoped>
.charts-container {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
}
.line-chart, .pie-chart {
  min-width: 300px;
  margin: 10px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.line-chart{
  width: 60%;

  @media (max-width: 768px) {
    width: 100%;
  }
}
.pie-chart {
  width: 40%;

  @media (max-width: 768px) {
    width: 100%;
  }

  canvas{
    background: #fff;
  }
}
canvas {
  width: 100% !important;
  height: auto !important;
}
h2 {
  text-align: center;
  color: #004581;
  font-size: 1.2rem;
  margin-bottom: 15px;
}
</style>