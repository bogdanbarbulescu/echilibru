document.addEventListener('DOMContentLoaded', () => {
    const pillarCardsContainer = document.getElementById('pillarCardsContainer');
    const datePicker = document.getElementById('datePicker');
    const saveDayBtn = document.getElementById('saveDayBtn');
    const tipsModal = new bootstrap.Modal(document.getElementById('tipsModal')); // Initialize Bootstrap modal
    const modalPillarName = document.getElementById('modalPillarName');
    const modalTipsList = document.getElementById('modalTipsList');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const scoreChartCanvas = document.getElementById('scoreChart');
    let scoreChart; // To hold the Chart.js instance

    // Define the 8 pillars and their tips
    const pillars = [
        { id: 'physicalHealth', name: 'Sănătate fizică', tips: ['Alimentație echilibrată', 'Exercițiu regulat (min 150 min/săpt)', 'Somn de calitate (7-9 ore)', 'Îngrijire preventivă'] },
        { id: 'mentalEmotional', name: 'Sănătate mentală și emoțională', tips: ['Practici de reducere a stresului (meditație)', 'Gestionarea emoțiilor (jurnal, terapie)', 'Stabilirea limitelor și deconectare'] },
        { id: 'relationships', name: 'Relații și comunitate', tips: ['Legături cu familia și prietenii', 'Implicare în activități de grup/voluntariat', 'Comunicare deschisă'] },
        { id: 'career', name: 'Carieră și dezvoltare profesională', tips: ['Obiective clare', 'Învățare continuă', 'Echilibru muncă–viață'] },
        { id: 'personalGrowth', name: 'Dezvoltare personală și sens', tips: ['Stabilirea unui scop/valori', 'Hobby-uri și proiecte creative', 'Lectură, reflecție'] },
        { id: 'recreation', name: 'Recreere și timp liber', tips: ['Activități care îți aduc bucurie', 'Pauze regulate', 'Explorarea naturii'] },
        { id: 'financial', name: 'Stabilitate financiară', tips: ['Bugetare și economisire', 'Investiții de bază (fond urgență)', 'Planificare pe termen lung'] },
        { id: 'environment', name: 'Mediu și organizare', tips: ['Spațiu ordonat (acasă/muncă)', 'Gestionarea timpului (to-do list)', 'Reducerea "zgomotului" informațional'] }
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

    function updateScoreDisplay(pillarId, score) {
        const card = pillarCardsContainer.querySelector(`[data-pillar-id="${pillarId}"]`);
        if (card) {
            const scoreButtons = card.querySelectorAll('.score-selector .btn');
            scoreButtons.forEach(button => {
                const btnScore = parseInt(button.getAttribute('data-score'));
                if (btnScore <= score) {
                    button.classList.add('selected');
                } else {
                    button.classList.remove('selected');
                }
            });
        }
    }

    // --- Event Handlers ---

    // Event delegation for score buttons
    pillarCardsContainer.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('btn') && target.closest('.score-selector')) {
            const scoreButton = target;
            const score = parseInt(scoreButton.getAttribute('data-score'));
            const cardBody = scoreButton.closest('.card-body');
            const pillarId = cardBody.closest('.card').getAttribute('data-pillar-id');

            // Update visual
            updateScoreDisplay(pillarId, score);

            // Store score temporarily for the current day shown
            const currentDate = datePicker.value;
             // Ensure current day's data structure exists
            if (!lifeData[currentDate]) {
                 lifeData[currentDate] = {};
             }
            lifeData[currentDate][pillarId] = score;
             // Note: Data is only truly saved on 'Save Day' button click
        }

        // Event delegation for tips buttons
        if (target.classList.contains('tips-button')) {
            const pillarId = target.getAttribute('data-pillar-id');
            showTipsModal(pillarId);
        }
    });


    saveDayBtn.addEventListener('click', () => {
        // Data is already updated in lifeData object by score button clicks
        // Just need to save it to localStorage
        saveData();
        // Optionally, show a save confirmation message
        saveDayBtn.textContent = 'Saved!';
        saveDayBtn.classList.add('btn-success');
        setTimeout(() => {
            saveDayBtn.textContent = 'Salvează Ziua';
            saveDayBtn.classList.remove('btn-success');
        }, 2000); // Reset button text after 2 seconds

        updateChartForSelectedDate(); // Update graph after saving
    });

    datePicker.addEventListener('change', (event) => {
        const selectedDate = event.target.value;
        const scores = getScoresForDate(selectedDate);
        renderPillarCards(scores); // Re-render cards with scores for the selected date
        updateChartForSelectedDate(); // Update graph based on new selected date
    });

    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'disabled');
        }
         updateChartForSelectedDate(); // Update chart colors if needed
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

        tipsModal.show(); // Show the Bootstrap modal
    }

    // --- Chart.js Graph ---

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

    function prepareChartData(dateRange) {
        const datasets = [];
        const isDarkMode = document.body.classList.contains('dark-mode');
         // Define distinct colors, accessible in light and dark modes
        const colors = [
            'rgba(75, 192, 192, 1)', // Green
            'rgba(255, 99, 132, 1)', // Red
            'rgba(54, 162, 235, 1)', // Blue
            'rgba(255, 205, 86, 1)', // Yellow
            'rgba(153, 102, 255, 1)', // Purple
            'rgba(201, 203, 207, 1)', // Grey
            'rgba(255, 159, 64, 1)', // Orange
            'rgba(199, 199, 199, 1)'  // Light Grey
        ];

         const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.1)';
         const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
         const tickColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';


        pillars.forEach((pillar, index) => {
            const data = dateRange.map(dateStr => {
                const dailyScores = lifeData[dateStr] || {};
                return dailyScores[pillar.id] || null; // Use null for missing data points
            });

            datasets.push({
                label: pillar.name,
                data: data,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length].replace('1)', '0.2)'), // Lighter fill
                tension: 0.1, // Curve the lines
                fill: false, // No fill under the line
                spanGaps: true // Connect missing data points
            });
        });

        return {
            labels: dateRange,
            datasets: datasets
        };
    }

    function initChart() {
         const ctx = scoreChartCanvas.getContext('2d');
         scoreChart = new Chart(ctx, {
             type: 'line',
             data: {
                 labels: [],
                 datasets: []
             },
             options: {
                 responsive: true,
                 maintainAspectRatio: false,
                 scales: {
                     y: {
                         beginAtZero: true,
                         max: 5, // Max score is 5
                         title: {
                              display: true,
                              text: 'Score',
                              color: tickColor // Use tick color for axis title
                         },
                          ticks: {
                            stepSize: 1,
                            color: tickColor // Tick colors
                         },
                          grid: {
                            color: gridColor // Grid line color
                         }
                     },
                      x: {
                          title: {
                              display: true,
                              text: 'Data',
                                color: tickColor // Use tick color for axis title
                          },
                           ticks: {
                             color: tickColor // Tick colors
                           },
                           grid: {
                             color: gridColor // Grid line color
                           }
                      }
                 },
                 plugins: {
                     legend: {
                         position: 'bottom',
                         labels: {
                             color: tickColor // Legend text color
                         }
                     },
                     title: {
                         display: false, // Hide chart title if already in card title
                         text: 'Evoluția Scorurilor'
                     }
                 }
             }
         });
     }

    function updateChartForSelectedDate() {
         if (!scoreChart) {
             initChart(); // Initialize if not already done
         }
        const selectedDate = datePicker.value;
        const dateRange = getDatesForLast7Days(selectedDate);
        const chartData = prepareChartData(dateRange);

         // Update Chart data and options based on dark mode
         const isDarkMode = document.body.classList.contains('dark-mode');
         const tickColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
         const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

         scoreChart.data.labels = chartData.labels;
         scoreChart.data.datasets = chartData.datasets;
         scoreChart.options.scales.y.ticks.color = tickColor;
         scoreChart.options.scales.y.grid.color = gridColor;
         scoreChart.options.scales.y.title.color = tickColor; // Update Y-axis title color
         scoreChart.options.scales.x.ticks.color = tickColor;
         scoreChart.options.scales.x.grid.color = gridColor;
          scoreChart.options.scales.x.title.color = tickColor; // Update X-axis title color
         scoreChart.options.plugins.legend.labels.color = tickColor; // Update legend color


        scoreChart.update();
    }


    // --- Initialization ---

    function initializeApp() {
        // 1. Load data
        loadData();

        // 2. Set date picker to today
        const today = new Date().toISOString().split('T')[0];
        datePicker.value = today;

        // 3. Render cards for today's data
        const todayScores = getScoresForDate(today);
        renderPillarCards(todayScores);

        // 4. Load dark mode preference
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'enabled') {
            darkModeToggle.checked = true;
            document.body.classList.add('dark-mode');
        } else {
             // Ensure it's off by default or if disabled explicitly
             darkModeToggle.checked = false;
             document.body.classList.remove('dark-mode');
        }

        // 5. Initialize and update chart
        initChart(); // Initialize with basic structure
        updateChartForSelectedDate(); // Populate chart with data for the last 7 days ending today
    }

    // Run initialization
    initializeApp();
});
