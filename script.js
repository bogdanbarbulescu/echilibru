document.addEventListener('DOMContentLoaded', () => {
    const pillarCardsContainer = document.getElementById('pillarCardsContainer');
    const datePicker = document.getElementById('datePicker');
    const saveDayBtn = document.getElementById('saveDayBtn');
    const tipsModal = new bootstrap.Modal(document.getElementById('tipsModal'));
    const modalPillarName = document.getElementById('modalPillarName');
    const modalTipsList = document.getElementById('modalTipsList');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const mainContent = document.getElementById('mainContent'); // Element to fade

    // Chart canvases and related elements
    const weeklyLineChartCanvas = document.getElementById('weeklyLineChart');
    const dailyRadarChartCanvas = document.getElementById('dailyRadarChart');
    const averageBarChartCanvas = document.getElementById('averageBarChart');
    const dailyChartDateSpan = document.getElementById('dailyChartDate');
    const avgStartDatePicker = document.getElementById('avgStartDatePicker');
    const avgEndDatePicker = document.getElementById('avgEndDatePicker');
    const updateAvgChartBtn = document.getElementById('updateAvgChartBtn');


    let weeklyLineChart; // Chart.js instance
    let dailyRadarChart; // Chart.js instance
    let averageBarChart; // Chart.js instance

    // Define the 8 pillars and their tips - Added more varied colors for charts
    const pillars = [
        { id: 'physicalHealth', name: 'Sănătate fizică', color: '#4BC0C0', tips: ['Alimentație echilibrată', 'Exercițiu regulat (min 150 min/săpt)', 'Somn de calitate (7-9 ore)', 'Îngrijire preventivă'] },
        { id: 'mentalEmotional', name: 'Sănătate mentală și emoțională', color: '#FF6384', tips: ['Practici de reducere a stresului (meditație)', 'Gestionarea emoțiilor (jurnal, terapie)', 'Stabilirea limitelor și deconectare'] },
        { id: 'relationships', name: 'Relații și comunitate', color: '#36A2EB', tips: ['Legături cu familia și prietenii', 'Implicare în activități de grup/voluntariat', 'Comunicare deschisă'] },
        { id: 'career', name: 'Carieră și dezvoltare profesională', color: '#FFCE56', tips: ['Obiective clare', 'Învățare continuă', 'Echilibru muncă–viață'] },
        { id: 'personalGrowth', name: 'Dezvoltare personală și sens', color: '#9966CC', tips: ['Stabilirea unui scop/valori', 'Hobby-uri și proiecte creative', 'Lectură, reflecție'] },
        { id: 'recreation', name: 'Recreere și timp liber', color: '#C9CBCF', tips: ['Activități care îți aduc bucurie', 'Pauze regulate', 'Explorarea naturii'] },
        { id: 'financial', name: 'Stabilitate financiară', color: '#FF9F40', tips: ['Bugetare și economisire', 'Investiții de bază (fond urgență)', 'Planificare pe termen lung'] },
        { id: 'environment', name: 'Mediu și organizare', color: '#A1C181', tips: ['Spațiu ordonat (acasă/muncă)', 'Gestionarea timpului (to-do list)', 'Reducerea "zgomotului" informațional'] }
    ];

    // --- Data Management (localStorage) ---
    let lifeData = {}; // Holds all historical data

    function loadData() {
        const data = localStorage.getItem('balancedLifeData');
        if (data) {
            try {
                lifeData = JSON.parse(data);
            } catch (e) {
                console.error("Error parsing localStorage data:", e);
                lifeData = {}; // Reset if data is corrupted
            }
        } else {
            lifeData = {};
        }
    }

    function saveData() {
        localStorage.setItem('balancedLifeData', JSON.stringify(lifeData));
        console.log("Data saved to localStorage");
    }

    function getScoresForDate(dateStr) {
        return lifeData[dateStr] || {};
    }

    function setScoresForDate(dateStr, scores) {
        lifeData[dateStr] = scores;
    }

     // --- UI Rendering ---

    function renderPillarCards(scores) {
        pillarCardsContainer.innerHTML = ''; // Clear previous cards
        pillars.forEach(pillar => {
            const currentScore = scores[pillar.id] || 0; // Get score for this pillar or default to 0

            const cardHtml = `
                <div class="col">
                    <div class="card h-100" data-pillar-id="${pillar.id}">
                        <div class="card-body d-flex flex-column justify-content-between">
                            <h5 class="card-title">${pillar.name}</h5>
                            <div class="score-selector mb-3 d-flex justify-content-center">
                                ${[1, 2, 3, 4, 5].map(score => `
                                    <button type="button" class="btn btn-outline-secondary btn-sm ${score <= currentScore ? 'selected' : ''}" data-score="${score}">
                                        ${score}
                                    </button>
                                `).join('')}
                            </div>
                            <button type="button" class="btn btn-sm btn-outline-info mt-auto tips-button" data-pillar-id="${pillar.id}">
                                + Tips
                            </button>
                        </div>
                    </div>
                </div>
            `;
            pillarCardsContainer.innerHTML += cardHtml;
        });
    }

    function updateScoreDisplay(cardElement, score) {
        const scoreButtons = cardElement.querySelectorAll('.score-selector .btn');
        scoreButtons.forEach(button => {
            const btnScore = parseInt(button.getAttribute('data-score'));
            if (btnScore <= score) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });
    }

     // --- Animation ---

    function applyFadeTransition() {
        mainContent.classList.add('faded');
        // Remove faded class after the transition completes
        setTimeout(() => {
            mainContent.classList.remove('faded');
        }, 300); // Match CSS transition duration
    }

    // --- Event Handlers ---

    // Event delegation for score buttons and tips buttons
    pillarCardsContainer.addEventListener('click', (event) => {
        const target = event.target;

        // Handle Score Button Click
        if (target.classList.contains('btn') && target.closest('.score-selector')) {
            const scoreButton = target;
            const score = parseInt(scoreButton.getAttribute('data-score'));
            const card = scoreButton.closest('.card');
            const pillarId = card.getAttribute('data-pillar-id');

            // Update visual
            updateScoreDisplay(card, score);

            // Store score temporarily for the current day shown
            const currentDate = datePicker.value;
             // Ensure current day's data structure exists
            if (!lifeData[currentDate]) {
                 lifeData[currentDate] = {};
             }
            lifeData[currentDate][pillarId] = score;
            // Note: Data is only truly saved on 'Save Day' button click
        }

        // Handle Tips Button Click
        if (target.classList.contains('tips-button')) {
            const pillarId = target.getAttribute('data-pillar-id');
            showTipsModal(pillarId);
        }
    });


    saveDayBtn.addEventListener('click', () => {
        // Data is already updated in lifeData object by score button clicks
        // Just need to save it to localStorage
        saveData();

        // Animate save button
        saveDayBtn.textContent = 'Saved!';
        saveDayBtn.classList.add('btn-success');
        setTimeout(() => {
            saveDayBtn.textContent = 'Salvează Ziua';
            saveDayBtn.classList.remove('btn-success');
        }, 2000); // Reset button text after 2 seconds

        // Update charts
        updateChartsForSelectedDate();
        updateAverageBarChart(); // Update average chart too
    });

    datePicker.addEventListener('change', (event) => {
        applyFadeTransition(); // Apply fade effect

        // Wait for fade-out before updating content
        setTimeout(() => {
            const selectedDate = event.target.value;
            const scores = getScoresForDate(selectedDate);
            renderPillarCards(scores); // Re-render cards with scores for the selected date
            updateChartsForSelectedDate(); // Update graphs based on new selected date
             // Note: Average chart doesn't depend on this date, only its own range pickers
        }, 300); // Match fade transition duration
    });

    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'disabled');
        }
        // Update charts to reflect potential color changes
         updateChartsForSelectedDate();
         updateAverageBarChart();
    });

     updateAvgChartBtn.addEventListener('click', () => {
         updateAverageBarChart();
     });


    // --- Tips Modal ---

    function showTipsModal(pillarId) {
        const pillar = pillars.find(p => p.id === pillarId);
        if (!pillar) return;

        modalPillarName.textContent = pillar.name;
        modalTipsList.innerHTML = '';
        pillar.tips.forEach(tip => {
            const li = document.createElement('li');
            li.textContent = tip;
            modalTipsList.appendChild(li);
        });

        tipsModal.show();
    }

    // --- Chart.js Graphs ---

    function getDatesBetween(startDateStr, endDateStr) {
        const dates = [];
        const currentDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        while (currentDate <= endDate) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    }

    function getDatesForLast7Days(endDateStr) {
        const dates = [];
        const endDate = new Date(endDateStr);
        for (let i = 6; i >= 0; i--) {
            const d = new Date(endDate);
            d.setDate(endDate.getDate() - i);
            dates.push(d.toISOString().split('T')[0]); // Format as YYYY-MM-DD
        }
        return dates;
    }

    function getChartColors() {
         const isDarkMode = document.body.classList.contains('dark-mode');
         return {
             tickColor: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
             gridColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
             tooltipBg: isDarkMode ? 'var(--chart-tooltip-bg)' : 'var(--chart-tooltip-bg)',
             tooltipText: isDarkMode ? 'var(--chart-tooltip-text)' : 'var(--chart-tooltip-text)',
             pillarColors: pillars.map(p => p.color) // Use predefined pillar colors
         };
    }

    function updateChartOptions(chart) {
         if (!chart) return;
         const colors = getChartColors();
          // Common options to update for themes
         const commonOptions = {
             scales: {
                 y: {
                     ticks: { color: colors.tickColor },
                     grid: { color: colors.gridColor },
                     title: { color: colors.tickColor }
                 },
                 x: {
                     ticks: { color: colors.tickColor },
                     grid: { color: colors.gridColor },
                     title: { color: colors.tickColor }
                 }
             },
              plugins: {
                 legend: {
                     labels: { color: colors.tickColor }
                 },
                  tooltip: {
                     backgroundColor: colors.tooltipBg,
                     titleColor: colors.tooltipText,
                     bodyColor: colors.tooltipText,
                     footerColor: colors.tooltipText
                 }
             }
         };

         // Merge common options, handling radar specific scale
         if (chart.config.type === 'radar') {
             // Radar scale is slightly different
              commonOptions.scales = {
                  r: {
                    angleLines: { color: colors.gridColor },
                    grid: { color: colors.gridColor },
                    pointLabels: { color: colors.tickColor },
                     ticks: {
                         display: false, // Hide radar numbers for cleaner look
                         maxTicksLimit: 6, // Still define max ticks even if not displayed
                         color: colors.tickColor
                     },
                    beginAtZero: true,
                    max: 5 // Radar max score
                  }
              };
         }

         Chart.helpers.merge(chart.options, commonOptions); // Merge options
         chart.update();
    }


    // --- Weekly Line Chart ---
    function prepareLineChartData(dateRange) {
        const colors = getChartColors();
        const datasets = pillars.map((pillar, index) => {
            const data = dateRange.map(dateStr => {
                const dailyScores = lifeData[dateStr] || {};
                return dailyScores[pillar.id] || null; // Use null for missing data points
            });
            return {
                label: pillar.name,
                data: data,
                borderColor: pillar.color, // Use pillar's specific color
                backgroundColor: pillar.color.replace('1)', '0.2)'),
                tension: 0.1,
                fill: false,
                spanGaps: true
            };
        });

        return { labels: dateRange, datasets: datasets };
    }

     function initWeeklyLineChart() {
         const ctx = weeklyLineChartCanvas.getContext('2d');
         weeklyLineChart = new Chart(ctx, {
             type: 'line',
             data: { labels: [], datasets: [] },
             options: {
                 responsive: true,
                 maintainAspectRatio: false,
                 scales: {
                     y: { beginAtZero: true, max: 5, title: { display: true, text: 'Score' } },
                     x: { title: { display: true, text: 'Data' } }
                 },
                 plugins: { legend: { position: 'bottom' }, title: { display: false } }
             }
         });
          updateChartOptions(weeklyLineChart); // Apply initial theme colors
     }

    function updateWeeklyLineChart(endDateStr) {
         if (!weeklyLineChart) initWeeklyLineChart();
        const dateRange = getDatesForLast7Days(endDateStr);
        const chartData = prepareLineChartData(dateRange);

        weeklyLineChart.data.labels = chartData.labels;
        weeklyLineChart.data.datasets = chartData.datasets;

        updateChartOptions(weeklyLineChart); // Update options for theme/colors
    }


     // --- Daily Radar Chart ---
     function prepareRadarChartData(dateStr) {
          const scores = getScoresForDate(dateStr);
          const colors = getChartColors();

          return {
              labels: pillars.map(p => p.name), // Pillar names as labels
              datasets: [{
                  label: `Scoruri ${dateStr}`,
                  data: pillars.map(p => scores[p.id] || 0), // Get score for each pillar (0 if missing)
                  backgroundColor: colors.pillarColors[0].replace('1)', '0.4)'), // Use first pillar color, semi-transparent
                  borderColor: colors.pillarColors[0], // Use first pillar color
                  pointBackgroundColor: colors.pillarColors // Point colors match pillar colors
              }]
          };
     }

    function initDailyRadarChart() {
        const ctx = dailyRadarChartCanvas.getContext('2d');
         dailyRadarChart = new Chart(ctx, {
             type: 'radar',
             data: { labels: [], datasets: [] },
             options: {
                 responsive: true,
                 maintainAspectRatio: false,
                 scales: { r: { beginAtZero: true, max: 5 } },
                 plugins: { legend: { display: false }, title: { display: false } }
             }
         });
         updateChartOptions(dailyRadarChart); // Apply initial theme colors
     }

     function updateDailyRadarChart(dateStr) {
         if (!dailyRadarChart) initDailyRadarChart();
         dailyChartDateSpan.textContent = dateStr; // Update date span text
         const chartData = prepareRadarChartData(dateStr);

         dailyRadarChart.data.labels = chartData.labels;
         dailyRadarChart.data.datasets = chartData.datasets;
          dailyRadarChart.data.datasets[0].backgroundColor = getChartColors().pillarColors[0].replace('1)', '0.4)'); // Ensure color updates
          dailyRadarChart.data.datasets[0].borderColor = getChartColors().pillarColors[0];

         updateChartOptions(dailyRadarChart); // Update options for theme/colors
     }

      // --- Average Bar Chart ---

      function calculateAverageScores(startDateStr, endDateStr) {
           const dates = getDatesBetween(startDateStr, endDateStr);
           const scoresSum = {}; // { pillarId: sum_of_scores }
           const scoresCount = {}; // { pillarId: number_of_days_scored }

           pillars.forEach(pillar => {
               scoresSum[pillar.id] = 0;
               scoresCount[pillar.id] = 0;
           });

           dates.forEach(dateStr => {
               const dailyScores = lifeData[dateStr] || {};
               pillars.forEach(pillar => {
                   if (dailyScores[pillar.id] !== undefined) { // Only count if a score exists for the day
                       scoresSum[pillar.id] += dailyScores[pillar.id];
                       scoresCount[pillar.id]++;
                   }
               });
           });

           const averageScores = {};
           pillars.forEach(pillar => {
               averageScores[pillar.id] = scoresCount[pillar.id] > 0 ? scoresSum[pillar.id] / scoresCount[pillar.id] : 0;
           });

           return averageScores;
      }

      function prepareAverageBarChartData(startDateStr, endDateStr) {
          const averageScores = calculateAverageScores(startDateStr, endDateStr);
          const colors = getChartColors();

          return {
              labels: pillars.map(p => p.name),
              datasets: [{
                  label: 'Scor Mediu',
                  data: pillars.map(p => averageScores[p.id]),
                   backgroundColor: colors.pillarColors.map(color => color.replace('1)', '0.6)')), // Slightly less opaque bars
                   borderColor: colors.pillarColors,
                   borderWidth: 1
              }]
          };
      }

      function initAverageBarChart() {
          const ctx = averageBarChartCanvas.getContext('2d');
           averageBarChart = new Chart(ctx, {
               type: 'bar',
               data: { labels: [], datasets: [] },
               options: {
                   responsive: true,
                   maintainAspectRatio: false,
                   scales: {
                       y: { beginAtZero: true, max: 5, title: { display: true, text: 'Scor Mediu' } },
                       x: { title: { display: true, text: 'Pilon' } }
                   },
                   plugins: { legend: { display: false }, title: { display: false } }
               }
           });
            updateChartOptions(averageBarChart); // Apply initial theme colors
       }

      function updateAverageBarChart() {
           if (!averageBarChart) initAverageBarChart();

           let startDate = avgStartDatePicker.value;
           let endDate = avgEndDatePicker.value;

           // Set default range if inputs are empty (e.g., last 30 days)
           if (!startDate || !endDate) {
               endDate = new Date().toISOString().split('T')[0]; // Today
               const start = new Date();
               start
