/**
 * HomeYield Real Estate Investment Calculator - Complete Version
 * Version: 2.0.0
 * 
 * This script contains all functionality for the HomeYield calculator
 * including integrated chart visualizations
 * Designed to be hosted on GitHub and loaded into Webflow
 */

(function() {
    'use strict';

    // Global configuration
    const CONFIG = {
        chartDefaults: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 300
            }
        },
        defaultMonthsToShow: 12,
        colors: {
            primary: '#7adfbb',
            secondary: '#ffd151',
            accent1: '#54a0ff',
            accent2: '#5f27cd',
            accent3: '#ff6b6b',
            accent4: '#10ac84'
        }
    };

    // ========== CHART MANAGEMENT UTILITIES ==========
    const ChartManager = {
        charts: {},
        
        destroyChart: function(chartId) {
            const canvas = document.getElementById(chartId);
            if (canvas) {
                const existingChart = Chart.getChart(canvas);
                if (existingChart) {
                    existingChart.destroy();
                }
            }
        },
        
        register: function(name, chartInstance) {
            this.charts[name] = chartInstance;
        },
        
        get: function(name) {
            return this.charts[name];
        },
        
        destroyAll: function() {
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
            this.charts = {};
        }
    };

    // ========== INITIALIZATION ==========
    
    // Wait for DOM and dependencies
    function initializeCalculator() {
        // Check dependencies
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is required but not loaded');
            // Try loading Chart.js dynamically
            loadChartJS();
            return;
        }

        console.log('Initializing HomeYield Calculator...');
        
        // Initialize global state
        window.HomeYield = {
            formDictionary: {},
            financialOutputs: {},
            sourcesAndUses: {},
            debtService: {},
            selectedMonthsToShow: CONFIG.defaultMonthsToShow,
            charts: {},
            isInitialized: false
        };

        // Initialize all components
        initializeDefaults();
        initializeFormHandlers();
        initializeCharts();
        performInitialCalculations();
        
        window.HomeYield.isInitialized = true;
        console.log('HomeYield Calculator initialized successfully');
    }

    // Dynamic Chart.js loader as fallback
    function loadChartJS() {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
        script.onload = function() {
            console.log('Chart.js loaded dynamically');
            setTimeout(initializeCalculator, 100);
        };
        script.onerror = function() {
            console.error('Failed to load Chart.js');
        };
        document.head.appendChild(script);
    }

    // ========== DEFAULT VALUES ==========
    
    function initializeDefaults() {
        window.HomeYield.defaults = {
            basic: {
                'purchase-price': 500000,
                'closing-costs': 5000,
                'investment-years': 20,
                'home-growth-rate': 4,
                'down-payment-percent': 25,
                'im-rate': 6,
                'monthly-rent': 4500,
                'annual-rent-increase': 2,
                'annual-insurance': 2000,
                'annual-hoa': 1500,
                'annual-property-tax': 2.25,
                'annual-maintenance': 1000,
                'cpi-assumption': 2,
                'management-fee': 10
            },
            advanced: {
                'purchase-price-advanced': 500000,
                'closing-costs-advanced': 2000,
                'investment-years-advanced': 20,
                'home-growth-rate-advanced': 4,
                'down-payment-percent-advanced': 25,
                'im-rate-advanced': 6,
                'monthly-rent-advanced': 4500,
                'annual-rent-increase-advanced': 2,
                'annual-insurance-advanced': 2000,
                'annual-hoa-advanced': 1500,
                'annual-property-tax-advanced': 2.25,
                'annual-maintenance-advanced': 1000,
                'management-fee-advanced': 10,
                'hel-amount': 50000,
                'hel-rate': 6,
                'hel-closing-fee': 1,
                'hel-extra-payment-times': 2,
                'hel-extra-payment-amount': 2500,
                'im-closing-fee': 1,
                'im-extra-payment-times': 2,
                'im-extra-payment-amount': 10000,
                'refinance-years': 5,
                'rm-rate': 4,
                'rm-closing-fee': 1,
                'rm-extra-payment-times': 2,
                'rm-extra-payment-amount': 2500,
                'occupancy-rate': 90,
                'annual-insurance-growth': 8,
                'annual-hoa-growth': 2,
                'property-tax-growth': 2,
                'maintenance-growth': 2
            }
        };

        // Apply defaults to form
        applyDefaultValues();
    }

    function applyDefaultValues() {
        const isAdvanced = document.getElementById('toggle-switch')?.checked || false;
        const defaults = isAdvanced ? window.HomeYield.defaults.advanced : window.HomeYield.defaults.basic;
        
        Object.entries(defaults).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                const format = element.getAttribute('data-format');
                if (format === 'currency') {
                    element.value = formatCurrency(value);
                } else if (format === 'percent') {
                    element.value = value + '%';
                } else {
                    element.value = value;
                }
            }
        });
    }

    // ========== FORM HANDLERS ==========
    
    function initializeFormHandlers() {
        // Form toggle
        const toggleSwitch = document.getElementById('toggle-switch');
        if (toggleSwitch) {
            toggleSwitch.addEventListener('change', handleFormToggle);
        }

        // Input handlers
        document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
            input.addEventListener('input', handleInputChange);
            input.addEventListener('blur', handleInputBlur);
        });

        // Radio button handlers
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', handleRadioChange);
        });

        // Collapsible sections
        initializeCollapsibles();

        // Advanced form options
        initializeAdvancedOptions();
        
        // Initialize tooltips
        initializeTooltips();
    }

    function handleFormToggle(e) {
        const basicForm = document.getElementById('basic-form');
        const advancedForm = document.getElementById('advanced-form');
        
        if (e.target.checked) {
            // Show advanced
            basicForm.classList.remove('active');
            advancedForm.classList.add('active');
        } else {
            // Show basic
            advancedForm.classList.remove('active');
            basicForm.classList.add('active');
        }
        
        applyDefaultValues();
        updateCalculations();
    }

    function handleInputChange(e) {
        e.target.classList.add('user-defined');
        updateCalculations();
    }

    function handleInputBlur(e) {
        formatInput(e.target);
    }

    function handleRadioChange(e) {
        updateCalculations();
    }

    function formatInput(input) {
        const format = input.getAttribute('data-format');
        const value = parseFloat(input.value.replace(/[$,%,]/g, ''));
        
        if (isNaN(value)) return;
        
        if (format === 'currency') {
            input.value = formatCurrency(value);
        } else if (format === 'percent') {
            input.value = value + '%';
        }
    }

    function initializeCollapsibles() {
        document.querySelectorAll('.homeyield-collapsible-header').forEach(header => {
            header.addEventListener('click', function(e) {
                e.preventDefault();
                const checkbox = this.previousElementSibling;
                const content = this.nextElementSibling;
                const icon = this.querySelector('.homeyield-collapsible-icon');
                
                checkbox.checked = !checkbox.checked;
                
                if (checkbox.checked) {
                    content.style.height = content.scrollHeight + 'px';
                    icon.textContent = '-';
                } else {
                    content.style.height = '0';
                    icon.textContent = '+';
                }
            });
        });
    }

    function initializeAdvancedOptions() {
        // HEL options
        const helOptions = {
            toggle: ['use-hel-yes', 'use-hel-no'],
            target: 'hel-options'
        };
        
        // Extra payment options
        const extraPaymentOptions = [
            { toggle: ['hel-extra-payments-yes', 'hel-extra-payments-no'], target: 'hel-extra-payment-options' },
            { toggle: ['im-extra-payments-yes', 'im-extra-payments-no'], target: 'im-extra-payment-options' },
            { toggle: ['rm-extra-payments-yes', 'rm-extra-payments-no'], target: 'rm-extra-payment-options' }
        ];
        
        // Refinance options
        const refinanceOptions = {
            toggle: ['refinance-mortgage-yes', 'refinance-mortgage-no'],
            target: 'rm-options'
        };
        
        // Setup all toggles
        [helOptions, refinanceOptions, ...extraPaymentOptions].forEach(option => {
            const yesBtn = document.getElementById(option.toggle[0]);
            const noBtn = document.getElementById(option.toggle[1]);
            const target = document.getElementById(option.target);
            
            if (yesBtn && noBtn && target) {
                yesBtn.addEventListener('change', () => {
                    if (yesBtn.checked) target.style.display = 'block';
                });
                noBtn.addEventListener('change', () => {
                    if (noBtn.checked) target.style.display = 'none';
                });
            }
        });
    }

    function initializeTooltips() {
        document.querySelectorAll('.homeyield-info-icon').forEach(icon => {
            let tooltip = null;
            
            icon.addEventListener('mouseenter', function(e) {
                const text = this.getAttribute('data-tooltip');
                if (!text) return;
                
                tooltip = document.createElement('div');
                tooltip.className = 'homeyield-tooltip';
                tooltip.textContent = text;
                document.body.appendChild(tooltip);
                
                const rect = this.getBoundingClientRect();
                tooltip.style.left = rect.left + 'px';
                tooltip.style.top = (rect.bottom + 5) + 'px';
            });
            
            icon.addEventListener('mouseleave', function() {
                if (tooltip) {
                    tooltip.remove();
                    tooltip = null;
                }
            });
        });
    }

    // ========== CALCULATIONS ==========
    
    function updateCalculations() {
        if (!window.HomeYield.isInitialized) return;
        
        // Update form dictionary
        updateFormDictionary();
        
        // Perform calculations
        const results = performCalculations();
        
        // Update all visualizations
        updateAllCharts(results);
        updateTables(results);
        
        // Store results globally
        window.HomeYield.financialOutputs = results.cashFlows;
        window.formDictionary = window.HomeYield.formDictionary;
        window.financialOutputs = results.cashFlows;
        window.sourcesAndUses = results.sourcesAndUses;
        window.debtService = results.debtService;
    }

    function updateFormDictionary() {
        const dict = {};
        const isAdvanced = document.getElementById('toggle-switch')?.checked || false;
        const formId = isAdvanced ? 'advanced-form' : 'basic-form';
        const form = document.getElementById(formId);
        
        if (!form) return;
        
        // Collect all input values
        form.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
            let key = input.id.replace('-advanced', '');
            const format = input.getAttribute('data-format');
            let value = input.value;
            
            if (format === 'currency') {
                value = parseFloat(value.replace(/[$,]/g, '')) || 0;
            } else if (format === 'percent') {
                value = (parseFloat(value.replace(/%/g, '')) || 0) / 100;
            } else {
                value = parseFloat(value) || 0;
            }
            
            dict[key] = value;
        });
        
        // Collect radio values
        form.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            let key = radio.name.replace('-advanced', '');
            dict[key] = radio.value === 'yes' ? 1 : radio.value === 'no' ? 0 : parseFloat(radio.value);
        });
        
        window.HomeYield.formDictionary = dict;
    }

    function performCalculations() {
        const dict = window.HomeYield.formDictionary;
        
        // Calculate sources and uses
        const sourcesAndUses = calculateSourcesAndUses(dict);
        window.HomeYield.sourcesAndUses = sourcesAndUses;
        
        // Get schedule
        const schedule = getMonthsAndFlags(dict);
        
        // Calculate debt service
        const debtService = calculateDebtService(schedule, dict);
        window.HomeYield.debtService = debtService;
        
        // Calculate cash flows
        const cashFlows = calculateCashFlows(schedule, dict, debtService);
        
        return {
            sourcesAndUses,
            schedule,
            debtService,
            cashFlows,
            metrics: calculateMetrics(cashFlows, sourcesAndUses, dict)
        };
    }

    function performInitialCalculations() {
        // Set default radio values
        document.getElementById('im-term-30').checked = true;
        
        // Trigger initial calculation
        updateCalculations();
    }

    // ========== FINANCIAL CALCULATIONS ==========
    
    function calculateSourcesAndUses(dict) {
        const purchasePrice = dict['purchase-price'] || 0;
        const closingCosts = dict['closing-costs'] || 0;
        const downPaymentPercent = dict['down-payment-percent'] || 0;
        const imClosingFee = dict['im-closing-fee'] || 0;
        const helClosingFee = dict['hel-closing-fee'] || 0;
        const helAmount = dict['hel-amount'] || 0;
        const useHel = dict['use-hel'] || 0;
        
        const downPayment = purchasePrice * downPaymentPercent;
        const initialMortgage = purchasePrice - downPayment;
        const closingLoanCosts = initialMortgage * imClosingFee + useHel * helAmount * helClosingFee;
        const totalUses = purchasePrice + closingCosts + closingLoanCosts;
        const totalFinancing = useHel ? (helAmount + initialMortgage) : initialMortgage;
        const equityNeeded = totalUses - totalFinancing;
        const totalSources = useHel * helAmount + initialMortgage + equityNeeded;
        
        return {
            equity: equityNeeded,
            hel: useHel ? helAmount : 0,
            initialMortgage: initialMortgage,
            totalSources: totalSources,
            purchasePrice: purchasePrice,
            closingCosts: closingCosts,
            closingLoanCosts: closingLoanCosts,
            totalUses: totalUses
        };
    }

    function getMonthsAndFlags(dict) {
        const months = dict['investment-years'] * 12 + 1;
        const monthsArray = Array.from({length: months}, (_, i) => i);
        const holdArray = monthsArray.map((_, i) => i === 0 ? 0 : 1);
        const annualFlag = monthsArray.map((_, i) => i === 0 ? 0 : (i % 12 === 0 ? 1 : 0));
        
        // Calculate payment periods based on refinancing
        let imPaymentPeriod = [...holdArray];
        let helPaymentPeriod = [...holdArray];
        let rmPaymentPeriod = Array(months).fill(0);
        
        const useHel = dict['use-hel'] || 0;
        const helTermMonths = useHel ? (dict['hel-term'] * 12) : 0;
        const refinance = dict['refinance-mortgage'] || 0;
        const refinanceMonth = refinance ? dict['refinance-years'] * 12 : -1;
        
        if (refinance && refinanceMonth > 0) {
            // Adjust payment periods for refinancing
            imPaymentPeriod = holdArray.map((val, i) => {
                if (i === 0) return 0;
                if (i <= refinanceMonth) return i;
                return 0;
            });
            
            rmPaymentPeriod = holdArray.map((val, i) => {
                if (i <= refinanceMonth) return 0;
                return i - refinanceMonth;
            });
        }
        
        // HEL payments only until term ends
        if (useHel) {
            helPaymentPeriod = holdArray.map((val, i) => {
                if (i === 0) return 0;
                if (i <= helTermMonths) return i;
                return 0;
            });
        } else {
            helPaymentPeriod = Array(months).fill(0);
        }
        
        return {
            months: monthsArray,
            annualFlag: annualFlag,
            holdPeriod: holdArray,
            imPaymentPeriod: imPaymentPeriod,
            helPaymentPeriod: helPaymentPeriod,
            rmPaymentPeriod: rmPaymentPeriod
        };
    }

    function calculateDebtService(schedule, dict) {
        const sourcesAndUses = window.HomeYield.sourcesAndUses;
        
        // Initialize debt service arrays
        const debtService = {
            'Initial Mortgage': initializeDebtArrays(schedule.months.length),
            'Home Equity Loan': initializeDebtArrays(schedule.months.length),
            'Refinanced Mortgage': initializeDebtArrays(schedule.months.length)
        };
        
        // Interest rates
        const imRate = dict['im-rate'] / 12;
        const helRate = dict['hel-rate'] / 12;
        const rmRate = dict['rm-rate'] / 12;
        
        // Terms
        const imTerm = dict['im-term'] * 12;
        const helTerm = dict['hel-term'] * 12;
        const rmTerm = dict['rm-term'] * 12;
        
        // Refinance info
        const refinanceActive = dict['refinance-mortgage'] || 0;
        const refinanceMonth = refinanceActive ? dict['refinance-years'] * 12 : -1;
        let refiValue = 0;
        
        // Calculate debt service for each month
        for (let i = 0; i < schedule.months.length; i++) {
            // Initial mortgage calculations
            calculateMonthlyDebtService(
                debtService['Initial Mortgage'],
                i,
                sourcesAndUses.initialMortgage,
                imRate,
                imTerm,
                schedule.imPaymentPeriod[i],
                dict['im-extra-payments'],
                dict['im-extra-payment-times'],
                dict['im-extra-payment-amount'],
                refinanceActive && i >= refinanceMonth
            );
            
            // HEL calculations
            if (dict['use-hel']) {
                calculateMonthlyDebtService(
                    debtService['Home Equity Loan'],
                    i,
                    sourcesAndUses.hel,
                    helRate,
                    helTerm,
                    schedule.helPaymentPeriod[i],
                    dict['hel-extra-payments'],
                    dict['hel-extra-payment-times'],
                    dict['hel-extra-payment-amount'],
                    false
                );
            }
            
            // Handle refinancing
            if (refinanceActive && i === refinanceMonth) {
                refiValue = debtService['Initial Mortgage'].EOP[i-1] || 0;
                debtService['Initial Mortgage'].Refinance[i] = -refiValue;
                debtService['Refinanced Mortgage'].Issuance[i] = refiValue;
            }
            
            // Refinanced mortgage calculations
            if (refinanceActive && i > refinanceMonth) {
                calculateMonthlyDebtService(
                    debtService['Refinanced Mortgage'],
                    i,
                    refiValue,
                    rmRate,
                    rmTerm,
                    schedule.rmPaymentPeriod[i],
                    dict['rm-extra-payments'],
                    dict['rm-extra-payment-times'],
                    dict['rm-extra-payment-amount'],
                    false
                );
            }
        }
        
        return debtService;
    }

    function initializeDebtArrays(length) {
        return {
            BOP: Array(length).fill(0),
            Issuance: Array(length).fill(0),
            'Extra Payments': Array(length).fill(0),
            Refinance: Array(length).fill(0),
            'Scheduled Payments': Array(length).fill(0),
            EOP: Array(length).fill(0),
            'Interest Expense': Array(length).fill(0)
        };
    }

    function calculateMonthlyDebtService(debtArrays, month, principal, rate, term, paymentPeriod, hasExtra, extraTimes, extraAmount, forceZero) {
        if (forceZero) {
            // After refinance, IM should be zero
            debtArrays.EOP[month] = 0;
            return;
        }
        
        // Beginning balance
        if (month === 0) {
            debtArrays.BOP[month] = 0;
            debtArrays.Issuance[month] = principal;
        } else {
            debtArrays.BOP[month] = debtArrays.EOP[month - 1];
        }
        
        // Extra payments
        if (hasExtra && paymentPeriod > 0) {
            const monthsBetween = Math.floor(12 / extraTimes);
            if (month > 0 && month % monthsBetween === 0) {
                debtArrays['Extra Payments'][month] = -(extraAmount / extraTimes);
            }
        }
        
        // Scheduled payments
        if (paymentPeriod > 0) {
            const payment = PMT(rate, term, -principal);
            const interest = debtArrays.BOP[month] * rate;
            const principalPayment = payment - interest;
            
            debtArrays['Scheduled Payments'][month] = -Math.min(
                principalPayment,
                debtArrays.BOP[month] + debtArrays.Issuance[month] + debtArrays['Extra Payments'][month]
            );
        }
        
        // Interest expense
        if (month === 0) {
            debtArrays['Interest Expense'][month] = debtArrays.Issuance[month] * rate;
        } else if (paymentPeriod > 0) {
            debtArrays['Interest Expense'][month] = debtArrays.BOP[month] * rate;
        }
        
        // End balance
        const cashFlow = debtArrays.Issuance[month] + 
                        debtArrays['Extra Payments'][month] + 
                        debtArrays.Refinance[month] + 
                        debtArrays['Scheduled Payments'][month];
        
        debtArrays.EOP[month] = Math.max(0, debtArrays.BOP[month] + cashFlow);
    }

    function calculateCashFlows(schedule, dict, debtService) {
        const isAdvanced = document.getElementById('toggle-switch')?.checked || false;
        const months = schedule.months.length;
        
        // Initialize arrays
        const cashFlows = {
            revenues: Array(months).fill(0),
            rawRevenues: Array(months).fill(0),
            insurance: Array(months).fill(0),
            hoa: Array(months).fill(0),
            propertyTax: Array(months).fill(0),
            maintenance: Array(months).fill(0),
            managementFee: Array(months).fill(0),
            operatingCF: Array(months).fill(0),
            leveredCF: Array(months).fill(0),
            propertyValue: Array(months).fill(0),
            // Add arrays for debt service components
            'IM Principal': Array(months).fill(0),
            'IM Interest': Array(months).fill(0),
            'IM Extra Payments': Array(months).fill(0),
            'HEL Principal': Array(months).fill(0),
            'HEL Interest': Array(months).fill(0),
            'HEL Extra Payments': Array(months).fill(0),
            'RM Principal': Array(months).fill(0),
            'RM Interest': Array(months).fill(0),
            'RM Extra Payments': Array(months).fill(0),
            'IM Balance': debtService['Initial Mortgage'].EOP,
            'HEL Balance': debtService['Home Equity Loan'].EOP,
            'RM Balance': debtService['Refinanced Mortgage'].EOP
        };
        
        // Extract debt service components
        for (let i = 0; i < months; i++) {
            cashFlows['IM Principal'][i] = Math.abs(debtService['Initial Mortgage']['Scheduled Payments'][i]);
            cashFlows['IM Interest'][i] = debtService['Initial Mortgage']['Interest Expense'][i];
            cashFlows['IM Extra Payments'][i] = Math.abs(debtService['Initial Mortgage']['Extra Payments'][i]);
            cashFlows['HEL Principal'][i] = Math.abs(debtService['Home Equity Loan']['Scheduled Payments'][i]);
            cashFlows['HEL Interest'][i] = debtService['Home Equity Loan']['Interest Expense'][i];
            cashFlows['HEL Extra Payments'][i] = Math.abs(debtService['Home Equity Loan']['Extra Payments'][i]);
            cashFlows['RM Principal'][i] = Math.abs(debtService['Refinanced Mortgage']['Scheduled Payments'][i]);
            cashFlows['RM Interest'][i] = debtService['Refinanced Mortgage']['Interest Expense'][i];
            cashFlows['RM Extra Payments'][i] = Math.abs(debtService['Refinanced Mortgage']['Extra Payments'][i]);
        }
        
        // Calculate property values and rent growth
        for (let i = 0; i < months; i++) {
            cashFlows.propertyValue[i] = dict['purchase-price'] * 
                Math.pow(1 + dict['home-growth-rate'] / 12, Math.max(0, i - 1));
            
            const yearsSinceStart = Math.floor((i - 1) / 12);
            const rentGrowth = Math.pow(1 + dict['annual-rent-increase'], Math.max(0, yearsSinceStart));
            
            if (schedule.holdPeriod[i]) {
                // Revenue calculations
                if (isAdvanced) {
                    cashFlows.rawRevenues[i] = dict['monthly-rent'] * rentGrowth;
                    cashFlows.revenues[i] = cashFlows.rawRevenues[i] * dict['occupancy-rate'];
                } else {
                    cashFlows.revenues[i] = dict['monthly-rent'] * rentGrowth;
                    cashFlows.rawRevenues[i] = cashFlows.revenues[i];
                }
                
                // Management fee
                cashFlows.managementFee[i] = -cashFlows.revenues[i] * dict['management-fee'];
                
                // Annual expenses (only on 12-month intervals)
                if (i % 12 === 0) {
                    if (isAdvanced) {
                        cashFlows.insurance[i] = -dict['annual-insurance'] * 
                            Math.pow(1 + dict['annual-insurance-growth'] / 12, i);
                        cashFlows.hoa[i] = -dict['annual-hoa'] * 
                            Math.pow(1 + dict['annual-hoa-growth'] / 12, i);
                        cashFlows.propertyTax[i] = -cashFlows.propertyValue[i] * dict['annual-property-tax'];
                        cashFlows.maintenance[i] = -dict['annual-maintenance'] * 
                            Math.pow(1 + dict['maintenance-growth'] / 12, i);
                    } else {
                        const cpi = Math.pow(1 + dict['cpi-assumption'] / 12, Math.max(0, i - 1));
                        cashFlows.insurance[i] = -dict['annual-insurance'] * cpi;
                        cashFlows.hoa[i] = -dict['annual-hoa'] * cpi;
                        cashFlows.propertyTax[i] = -cashFlows.propertyValue[i] * dict['annual-property-tax'];
                        cashFlows.maintenance[i] = -dict['annual-maintenance'] * cpi;
                    }
                }
            }
            
            // Operating cash flow
            cashFlows.operatingCF[i] = cashFlows.revenues[i] + 
                                       cashFlows.insurance[i] + 
                                       cashFlows.hoa[i] + 
                                       cashFlows.propertyTax[i] + 
                                       cashFlows.maintenance[i] + 
                                       cashFlows.managementFee[i];
            
            // Calculate total debt service
            const totalDebtService = calculateTotalDebtServiceForMonth(debtService, i);
            
            // Levered cash flow
            cashFlows.leveredCF[i] = cashFlows.operatingCF[i] + totalDebtService;
        }
        
        // Add proper names for chart compatibility
        cashFlows['Revenue'] = cashFlows.revenues;
        cashFlows['Raw Revenue'] = cashFlows.rawRevenues;
        cashFlows['Insurance'] = cashFlows.insurance;
        cashFlows['Property Tax'] = cashFlows.propertyTax;
        cashFlows['HOA'] = cashFlows.hoa;
        cashFlows['Maintenance'] = cashFlows.maintenance;
        cashFlows['Management Fee'] = cashFlows.managementFee;
        cashFlows['Levered FCF'] = cashFlows.leveredCF;
        
        // Calculate IRR
        const lastMonth = months - 1;
        const finalPropertyValue = cashFlows.propertyValue[lastMonth];
        const finalDebtBalance = cashFlows['IM Balance'][lastMonth] + 
                                cashFlows['HEL Balance'][lastMonth] + 
                                cashFlows['RM Balance'][lastMonth];
        const homeSaleProceeds = finalPropertyValue - finalDebtBalance;
        
        const xirrValues = [...cashFlows.leveredCF];
        xirrValues[0] = -window.HomeYield.sourcesAndUses.equity;
        xirrValues[lastMonth] += homeSaleProceeds;
        
        const xirrMonths = Array.from({length: months}, (_, i) => i);
        const xirr = XIRR(xirrValues, xirrMonths) || 0;
        
        cashFlows['IRR'] = xirr;
        
        return cashFlows;
    }

    function calculateTotalDebtServiceForMonth(debtService, month) {
        let total = 0;
        
        ['Initial Mortgage', 'Home Equity Loan', 'Refinanced Mortgage'].forEach(type => {
            total += (debtService[type]['Extra Payments'][month] || 0) +
                    (debtService[type]['Scheduled Payments'][month] || 0) -
                    (debtService[type]['Interest Expense'][month] || 0);
        });
        
        return total;
    }

    function calculateMetrics(cashFlows, sourcesAndUses, dict) {
        const months = cashFlows.leveredCF.length;
        const lastMonth = months - 1;
        
        // Calculate home sale proceeds
        const finalPropertyValue = cashFlows.propertyValue[lastMonth];
        const finalDebtBalance = calculateFinalDebtBalance(window.HomeYield.debtService, lastMonth);
        const homeSaleProceeds = finalPropertyValue - finalDebtBalance;
        
        // Prepare cash flows for XIRR
        const xirrValues = [...cashFlows.leveredCF];
        xirrValues[0] = -sourcesAndUses.equity;
        xirrValues[lastMonth] += homeSaleProceeds;
        
        const xirrMonths = Array.from({length: months}, (_, i) => i);
        
        // Calculate metrics
        const xirr = XIRR(xirrValues, xirrMonths) || 0;
        const totalDistributions = cashFlows.leveredCF
            .filter(cf => cf > 0)
            .reduce((sum, cf) => sum + cf, 0) + homeSaleProceeds;
        const totalContributions = sourcesAndUses.equity + cashFlows.leveredCF
            .filter(cf => cf < 0)
            .reduce((sum, cf) => sum - cf, 0);
        const moic = totalDistributions / totalContributions;
        
        return {
            xirr: xirr,
            moic: moic,
            totalDistributions: totalDistributions,
            totalContributions: totalContributions,
            homeSaleProceeds: homeSaleProceeds,
            finalPropertyValue: finalPropertyValue,
            finalDebtBalance: finalDebtBalance
        };
    }

    function calculateFinalDebtBalance(debtService, month) {
        return (debtService['Initial Mortgage'].EOP[month] || 0) +
               (debtService['Home Equity Loan'].EOP[month] || 0) +
               (debtService['Refinanced Mortgage'].EOP[month] || 0);
    }

    // ========== FINANCIAL MATH FUNCTIONS ==========
    
    function PMT(rate, nper, pv, fv = 0, type = 0) {
        if (rate === 0) return -(pv + fv) / nper;
        const pvif = Math.pow(1 + rate, nper);
        let pmt = (rate / (pvif - 1)) * -(pv * pvif + fv);
        if (type === 1) pmt /= 1 + rate;
        return pmt;
    }

    function XIRR(values, dates, guess = 0.1) {
        const maxIterations = 100;
        const tolerance = 0.0000001;
        
        let rate = guess;
        
        for (let i = 0; i < maxIterations; i++) {
            let npv = 0;
            let dnpv = 0;
            
            for (let j = 0; j < values.length; j++) {
                const exp = dates[j] / 12;
                const factor = Math.pow(1 + rate, exp);
                npv += values[j] / factor;
                dnpv -= exp * values[j] / (factor * (1 + rate));
            }
            
            if (Math.abs(npv) < tolerance) return rate;
            
            const newRate = rate - npv / dnpv;
            if (Math.abs(newRate - rate) < tolerance) return newRate;
            
            rate = newRate;
        }
        
        return null; // Failed to converge
    }

    // ========== CHARTS INTEGRATION ==========
    
    function initializeCharts() {
        console.log('Initializing all charts...');
        
        // Destroy any existing charts
        ChartManager.destroyAll();
        
        // Initialize each chart
        try {
            initializeSourcesUsesChart();
            initializeBarChart();
            initializeAnnualCashFlowChart();
            initializeDebtPaymentChart();
            initializeDebtBalanceChart();
            
            console.log('All charts initialized successfully');
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    function updateAllCharts(results) {
        // Update sources & uses
        if (window.updateSourcesUsesChart) {
            window.updateSourcesUsesChart(window.HomeYield.formDictionary);
        }
        
        // Update market comparison
        if (window.updateBarChart) {
            window.updateBarChart();
        }
        
        // Update annual cash flow
        if (window.updateAnnualCashFlowChart) {
            window.updateAnnualCashFlowChart(results.cashFlows);
        }
        
        // Update debt payment
        if (window.updateDebtPaymentChart) {
            window.updateDebtPaymentChart();
        }
        
        // Update debt balance
        if (window.updateDebtBalanceChart) {
            window.updateDebtBalanceChart(results.cashFlows);
        }
    }

    // ========== SOURCES & USES CHART ==========
    
    function initializeSourcesUsesChart() {
        console.log("Initializing Sources & Uses chart");
        
        const canvas = document.getElementById('sourcesUsesChart');
        if (!canvas) {
            console.error("Cannot find #sourcesUsesChart canvas element");
            return;
        }
        
        ChartManager.destroyChart('sourcesUsesChart');
        
        const ctx = canvas.getContext('2d');
        
        // Chart data configuration
        const chartData = {
            labels: ['Sources', 'Uses'],
            datasets: [
                { 
                    label: 'Equity', 
                    barPercentage: 0.9, 
                    backgroundColor: 'rgba(122, 223, 187, 0.6)', 
                    borderColor: 'rgba(122, 223, 187, 1)', 
                    data: [0, 0],
                    hoverBackgroundColor: 'rgba(122, 223, 187, 0.8)'
                },
                { 
                    label: 'HEL', 
                    barPercentage: 0.9, 
                    backgroundColor: 'rgba(54, 162, 235, 0.6)', 
                    borderColor: 'rgba(54, 162, 235, 1)', 
                    data: [0, 0],
                    hoverBackgroundColor: 'rgba(54, 162, 235, 0.8)'
                },
                { 
                    label: 'Initial Mortgage', 
                    barPercentage: 0.9, 
                    backgroundColor: 'rgba(255, 206, 86, 0.6)', 
                    borderColor: 'rgba(255, 206, 86, 1)', 
                    data: [0, 0],
                    hoverBackgroundColor: 'rgba(255, 206, 86, 0.8)'
                },
                { 
                    label: 'Purchase Price', 
                    barPercentage: 0.9, 
                    backgroundColor: 'rgba(153, 102, 255, 0.6)', 
                    borderColor: 'rgba(153, 102, 255, 1)', 
                    data: [0, 0],
                    hoverBackgroundColor: 'rgba(153, 102, 255, 0.8)'
                },
                { 
                    label: 'Closing Costs', 
                    barPercentage: 0.9, 
                    backgroundColor: 'rgba(252, 139, 86, 0.6)', 
                    borderColor: 'rgba(252, 139, 86, 1)', 
                    data: [0, 0],
                    hoverBackgroundColor: 'rgba(252, 139, 86, 0.8)'
                },
                { 
                    label: 'Loan Fees', 
                    barPercentage: 0.9, 
                    backgroundColor: 'rgba(255, 99, 132, 0.6)', 
                    borderColor: 'rgba(255, 99, 132, 1)', 
                    data: [0, 0],
                    hoverBackgroundColor: 'rgba(255, 99, 132, 0.8)'
                }
            ]
        };
        
        // Enhanced total labels plugin
        const totalLabelsPlugin = {
            id: 'totalLabels',
            afterDraw: (chart) => {
                const ctx = chart.ctx;
                const sourcesTotal = chart.totalSources || 0;
                const usesTotal = chart.totalUses || 0;
                
                if (sourcesTotal === 0 && usesTotal === 0) return;
                
                ctx.save();
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#000';
                
                const meta0 = chart.getDatasetMeta(0);
                const meta3 = chart.getDatasetMeta(3);
                
                if (meta0.data.length > 0 && meta3.data.length > 0) {
                    const sourcesX = meta0.data[0].x;
                    const usesX = meta3.data[1].x;
                    
                    // Find stack tops more efficiently
                    let sourcesYTop = chart.chartArea.bottom;
                    let usesYTop = chart.chartArea.bottom;
                    
                    for (let i = 0; i < 3; i++) {
                        const meta = chart.getDatasetMeta(i);
                        if (meta.data[0] && chart.data.datasets[i].data[0] > 0) {
                            sourcesYTop = Math.min(sourcesYTop, meta.data[0].y);
                        }
                    }
                    
                    for (let i = 3; i < 6; i++) {
                        const meta = chart.getDatasetMeta(i);
                        if (meta.data[1] && chart.data.datasets[i].data[1] > 0) {
                            usesYTop = Math.min(usesYTop, meta.data[1].y);
                        }
                    }
                    
                    // Draw totals with shadow for better visibility
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                    ctx.shadowBlur = 3;
                    
                    if (sourcesTotal > 0) {
                        ctx.fillText(formatCurrency(sourcesTotal, true), sourcesX, sourcesYTop - 10);
                    }
                    
                    if (usesTotal > 0) {
                        ctx.fillText(formatCurrency(usesTotal, true), usesX, usesYTop - 10);
                    }
                }
                ctx.restore();
            }
        };
        
        // Chart options
        const options = {
            ...CONFIG.chartDefaults,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + 
                                   formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value, true);
                        },
                        maxTicksLimit: 10
                    },
                    grid: {
                        drawBorder: false,
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    stacked: true,
                    ticks: { 
                        font: { weight: 'bold' },
                        padding: 10
                    },
                    grid: {
                        display: false
                    }
                }
            },
            hover: {
                animationDuration: 200
            }
        };
        
        // Create chart
        const sourcesUsesChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: options,
            plugins: [totalLabelsPlugin]
        });
        
        // Initialize properties
        sourcesUsesChart.totalSources = 0;
        sourcesUsesChart.totalUses = 0;
        
        // Register chart
        ChartManager.register('sourcesUses', sourcesUsesChart);
        window.sourcesUsesChart = sourcesUsesChart;
        
        // Update function
        window.updateSourcesUsesChart = function(updatedDictionary) {
            if (!updatedDictionary) return;
            
            try {
                const sourcesAndUses = calculateSourcesAndUses(updatedDictionary);
                
                // Batch updates
                const updates = [
                    [0, 0, sourcesAndUses.equity],
                    [1, 0, sourcesAndUses.hel],
                    [2, 0, sourcesAndUses.initialMortgage],
                    [3, 1, sourcesAndUses.purchasePrice],
                    [4, 1, sourcesAndUses.closingCosts],
                    [5, 1, sourcesAndUses.closingLoanCosts]
                ];
                
                updates.forEach(([datasetIdx, dataIdx, value]) => {
                    sourcesUsesChart.data.datasets[datasetIdx].data[dataIdx] = value;
                });
                
                sourcesUsesChart.totalSources = sourcesAndUses.totalSources;
                sourcesUsesChart.totalUses = sourcesAndUses.totalUses;
                
                sourcesUsesChart.update('none'); // Skip animation for performance
                
                // Update table
                createSourcesUsesTable(document.getElementById('toggle-switch')?.checked || false);
            } catch (error) {
                console.error('Error updating sources uses chart:', error);
            }
        };
        
        // Create initial table
        createSourcesUsesTable(false);
    }

    function createSourcesUsesTable(isAdvancedForm) {
        const tableContainer = document.getElementById('table-container');
        if (!tableContainer) return;
        
        const sourcesAndUses = window.HomeYield.sourcesAndUses || calculateSourcesAndUses(window.HomeYield.formDictionary);
        
        let html = '<table class="homeyield-summary-table">';
        
        // Sources
        html += '<tr><td><div class="homeyield-oval" style="background-color: rgba(122, 223, 187, 0.6);">Equity</div></td>';
        html += '<td class="currency-cell">' + formatCurrency(sourcesAndUses.equity) + '</td></tr>';
        
        if (isAdvancedForm && sourcesAndUses.hel > 0) {
            html += '<tr><td><div class="homeyield-oval" style="background-color: rgba(54, 162, 235, 0.6);">HEL</div></td>';
            html += '<td class="currency-cell">' + formatCurrency(sourcesAndUses.hel) + '</td></tr>';
        }
        
        html += '<tr><td><div class="homeyield-oval" style="background-color: rgba(255, 206, 86, 0.6);">Initial Mortgage</div></td>';
        html += '<td class="currency-cell">' + formatCurrency(sourcesAndUses.initialMortgage) + '</td></tr>';
        
        html += '<tr style="font-weight: bold; border-top: 2px solid #333;"><td>Total Sources</td>';
        html += '<td class="currency-cell">' + formatCurrency(sourcesAndUses.totalSources) + '</td></tr>';
        
        // Spacer
        html += '<tr><td colspan="2" style="height: 10px;"></td></tr>';
        
        // Uses
        html += '<tr><td><div class="homeyield-oval" style="background-color: rgba(153, 102, 255, 0.6);">Purchase Price</div></td>';
        html += '<td class="currency-cell">' + formatCurrency(sourcesAndUses.purchasePrice) + '</td></tr>';
        
        html += '<tr><td><div class="homeyield-oval" style="background-color: rgba(252, 139, 86, 0.6);">Closing Costs</div></td>';
        html += '<td class="currency-cell">' + formatCurrency(sourcesAndUses.closingCosts) + '</td></tr>';
        
        if (isAdvancedForm && sourcesAndUses.closingLoanCosts > 0) {
            html += '<tr><td><div class="homeyield-oval" style="background-color: rgba(255, 99, 132, 0.6);">Loan Fees</div></td>';
            html += '<td class="currency-cell">' + formatCurrency(sourcesAndUses.closingLoanCosts) + '</td></tr>';
        }
        
        html += '<tr style="font-weight: bold; border-top: 2px solid #333;"><td>Total Uses</td>';
        html += '<td class="currency-cell">' + formatCurrency(sourcesAndUses.totalUses) + '</td></tr>';
        
        html += '</table>';
        
        tableContainer.innerHTML = html;
    }

    // ========== MARKET COMPARISON CHART ==========
    
    function initializeBarChart() {
        console.log("Initializing market comparison chart");
        
        const canvas = document.getElementById('barChart');
        if (!canvas) {
            console.error("Bar chart canvas not found");
            return;
        }
        
        ChartManager.destroyChart('barChart');
        
        const benchmarks = {
            SPY: 0.115,
            VNQ: 0.068,
            VCIT: 0.039
        };
        
        const chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['S&P 500', 'RE ETF', 'Bond ETF', 'Your Property'],
                datasets: [{
                    label: 'Annual Returns',
                    backgroundColor: [
                        'rgba(255, 209, 81, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(164, 164, 164, 0.7)',
                        'rgba(122, 223, 187, 0.7)'
                    ],
                    hoverBackgroundColor: [
                        'rgba(255, 209, 81, 0.9)',
                        'rgba(75, 192, 192, 0.9)',
                        'rgba(164, 164, 164, 0.9)',
                        'rgba(122, 223, 187, 0.9)'
                    ],
                    data: [benchmarks.SPY, benchmarks.VNQ, benchmarks.VCIT, 0],
                    borderWidth: 2,
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                }]
            },
            options: {
                ...CONFIG.chartDefaults,
                layout: {
                    padding: {
                        top: 30,
                        bottom: 20
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return (context.raw * 100).toFixed(1) + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return (value * 100).toFixed(0) + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            },
            plugins: [{
                afterDatasetsDraw: function(chart) {
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.fillStyle = '#333';
                    
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        meta.data.forEach((bar, index) => {
                            const value = dataset.data[index];
                            const text = (value * 100).toFixed(1) + '%';
                            ctx.fillText(text, bar.x, bar.y - 5);
                        });
                    });
                    ctx.restore();
                }
            }]
        });
        
        ChartManager.register('marketComparison', chart);
        window.myChart = chart;
        
        // Update function
        window.updateBarChart = function() {
            if (chart && window.HomeYield.financialOutputs) {
                const newIRR = window.HomeYield.financialOutputs.IRR || 0;
                chart.data.datasets[0].data[3] = newIRR;
                
                // Update y-axis max
                const maxValue = Math.max(newIRR, ...Object.values(benchmarks));
                chart.options.scales.y.max = Math.ceil(maxValue * 20) / 20 + 0.03;
                
                chart.update();
            }
        };
    }

    // ========== ANNUAL CASH FLOW CHART ==========
    
    function initializeAnnualCashFlowChart() {
        console.log("Initializing annual cash flow chart");
        
        const canvas = document.getElementById('annualCashFlowChart');
        if (!canvas) {
            console.error("Cannot find #annualCashFlowChart canvas element");
            return;
        }
        
        ChartManager.destroyChart('annualCashFlowChart');
        
        const chartConfig = {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    // Expense categories (negative values)
                    {
                        label: 'Insurance',
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        stack: 'expenses',
                        order: 8,
                        data: []
                    },
                    {
                        label: 'Property Tax',
                        backgroundColor: 'rgba(255, 159, 64, 0.7)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1,
                        stack: 'expenses',
                        order: 7,
                        data: []
                    },
                    {
                        label: 'HOA',
                        backgroundColor: 'rgba(153, 102, 255, 0.7)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1,
                        stack: 'expenses',
                        order: 6,
                        data: []
                    },
                    {
                        label: 'Maintenance',
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        stack: 'expenses',
                        order: 5,
                        data: []
                    },
                    {
                        label: 'Management Fee',
                        backgroundColor: 'rgba(255, 206, 86, 0.7)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1,
                        stack: 'expenses',
                        order: 4,
                        data: []
                    },
                    {
                        label: 'Interest Expense',
                        backgroundColor: 'rgba(199, 199, 199, 0.7)',
                        borderColor: 'rgba(199, 199, 199, 1)',
                        borderWidth: 1,
                        stack: 'expenses',
                        order: 3,
                        data: []
                    },
                    {
                        label: 'Principal Payments',
                        backgroundColor: 'rgba(120, 120, 120, 0.7)',
                        borderColor: 'rgba(120, 120, 120, 1)',
                        borderWidth: 1,
                        stack: 'expenses',
                        order: 2,
                        data: []
                    },
                    // Revenue (positive values)
                    {
                        label: 'Revenue',
                        backgroundColor: 'rgba(122, 223, 187, 0.7)',
                        borderColor: 'rgba(122, 223, 187, 1)',
                        borderWidth: 1,
                        stack: 'revenue',
                        order: 1,
                        data: []
                    },
                    // Net cash flow line
                    {
                        label: 'Net Cash Flow',
                        type: 'line',
                        backgroundColor: 'transparent',
                        borderColor: 'rgba(0, 0, 0, 1)',
                        borderWidth: 3,
                        pointBackgroundColor: 'white',
                        pointBorderColor: 'black',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        tension: 0.1,
                        order: 0,
                        data: []
                    }
                ]
            },
            options: {
                ...CONFIG.chartDefaults,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            usePointStyle: true,
                            padding: 10,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                return 'Year ' + tooltipItems[0].label;
                            },
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw;
                                const formatted = formatCurrency(Math.abs(value));
                                
                                if (value < 0 && context.dataset.type !== 'line') {
                                    return `${label}: ${formatted} (expense)`;
                                }
                                return `${label}: ${formatted}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Year',
                            font: { size: 14, weight: 'bold' }
                        },
                        grid: { display: false }
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Annual Amount ($)',
                            font: { size: 14, weight: 'bold' }
                        },
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value, true);
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        };
        
        const annualCashFlowChart = new Chart(canvas, chartConfig);
        
        ChartManager.register('annualCashFlow', annualCashFlowChart);
        window.annualCashFlowChart = annualCashFlowChart;
        
        // Update function
        window.updateAnnualCashFlowChart = function(outputs) {
            if (!outputs) return;
            
            try {
                const investmentYears = window.HomeYield.formDictionary['investment-years'] || 20;
                
                // Prepare monthly data
                const monthlyData = {
                    revenue: outputs['Raw Revenue'] || outputs['Revenue'] || [],
                    insurance: outputs['Insurance'] || [],
                    propertyTax: outputs['Property Tax'] || [],
                    hoa: outputs['HOA'] || [],
                    maintenance: outputs['Maintenance'] || [],
                    managementFee: outputs['Management Fee'] || [],
                    interest: (outputs['IM Interest'] || []).map((val, idx) => 
                        val + (outputs['HEL Interest']?.[idx] || 0) + (outputs['RM Interest']?.[idx] || 0)
                    ),
                    principal: (outputs['IM Principal'] || []).map((val, idx) => 
                        val + (outputs['HEL Principal']?.[idx] || 0) + (outputs['RM Principal']?.[idx] || 0)
                    ),
                    netCashFlow: outputs['Levered FCF'] || []
                };
                
                // Aggregate to yearly data
                const yearlyData = aggregateMonthlyToYearly(monthlyData, investmentYears);
                
                // Update chart data
                annualCashFlowChart.data.labels = yearlyData.labels;
                
                const dataMapping = [
                    { idx: 0, key: 'insurance', negate: true },
                    { idx: 1, key: 'propertyTax', negate: true },
                    { idx: 2, key: 'hoa', negate: true },
                    { idx: 3, key: 'maintenance', negate: true },
                    { idx: 4, key: 'managementFee', negate: true },
                    { idx: 5, key: 'interest', negate: true },
                    { idx: 6, key: 'principal', negate: true },
                    { idx: 7, key: 'revenue', negate: false },
                    { idx: 8, key: 'netCashFlow', negate: false }
                ];
                
                dataMapping.forEach(({ idx, key, negate }) => {
                    const data = yearlyData.data[key];
                    if (data) {
                        annualCashFlowChart.data.datasets[idx].data = 
                            negate ? data.map(v => -Math.abs(v)) : data;
                    }
                });
                
                annualCashFlowChart.update();
            } catch (error) {
                console.error('Error updating annual cash flow chart:', error);
            }
        };
    }

    function aggregateMonthlyToYearly(monthlyData, years) {
        const result = {
            labels: [],
            data: {}
        };
        
        // Generate labels
        for (let i = 0; i < years; i++) {
            result.labels.push(`${i + 1}`);
        }
        
        // Process each data series
        Object.keys(monthlyData).forEach(key => {
            if (!Array.isArray(monthlyData[key])) return;
            
            result.data[key] = [];
            for (let year = 0; year < years; year++) {
                const startMonth = year === 0 ? 1 : year * 12 + 1;
                const endMonth = Math.min(startMonth + 12, monthlyData[key].length);
                let yearSum = 0;
                for (let month = startMonth; month < endMonth; month++) {
                    yearSum += monthlyData[key][month] || 0;
                }
                result.data[key].push(Math.abs(yearSum));
            }
        });
        
        return result;
    }

    // ========== DEBT PAYMENT CHART ==========
    
    function initializeDebtPaymentChart() {
        console.log("Initializing debt payment chart");
        
        const canvas = document.getElementById('annualDebtPaymentChart');
        if (!canvas) {
            console.error("Debt payment chart canvas not found");
            return;
        }
        
        ChartManager.destroyChart('annualDebtPaymentChart');
        
        // Color scheme for debt types
        const debtColors = {
            im: { 
                principal: 'rgba(255, 99, 132, 0.8)',
                interest: 'rgba(255, 99, 132, 0.5)',
                extra: 'rgba(255, 99, 132, 0.3)'
            },
            rm: {
                principal: 'rgba(153, 102, 255, 0.8)',
                interest: 'rgba(153, 102, 255, 0.5)',
                extra: 'rgba(153, 102, 255, 0.3)'
            },
            hel: {
                principal: 'rgba(54, 162, 235, 0.8)',
                interest: 'rgba(54, 162, 235, 0.5)',
                extra: 'rgba(54, 162, 235, 0.3)'
            }
        };
        
        const chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    // Initial Mortgage
                    {
                        label: 'Initial Mortgage Principal',
                        backgroundColor: debtColors.im.principal,
                        stack: 'Stack 0',
                        data: []
                    },
                    {
                        label: 'Initial Mortgage Interest',
                        backgroundColor: debtColors.im.interest,
                        stack: 'Stack 0',
                        data: []
                    },
                    {
                        label: 'Initial Mortgage Extra Payments',
                        backgroundColor: debtColors.im.extra,
                        stack: 'Stack 0',
                        data: []
                    },
                    // Refinanced Mortgage
                    {
                        label: 'Refinanced Mortgage Principal',
                        backgroundColor: debtColors.rm.principal,
                        stack: 'Stack 0',
                        data: []
                    },
                    {
                        label: 'Refinanced Mortgage Interest',
                        backgroundColor: debtColors.rm.interest,
                        stack: 'Stack 0',
                        data: []
                    },
                    {
                        label: 'Refinanced Mortgage Extra Payments',
                        backgroundColor: debtColors.rm.extra,
                        stack: 'Stack 0',
                        data: []
                    },
                    // Home Equity Loan
                    {
                        label: 'Home Equity Loan Principal',
                        backgroundColor: debtColors.hel.principal,
                        stack: 'Stack 0',
                        data: []
                    },
                    {
                        label: 'Home Equity Loan Interest',
                        backgroundColor: debtColors.hel.interest,
                        stack: 'Stack 0',
                        data: []
                    },
                    {
                        label: 'Home Equity Loan Extra Payments',
                        backgroundColor: debtColors.hel.extra,
                        stack: 'Stack 0',
                        data: []
                    }
                ]
            },
            options: {
                ...CONFIG.chartDefaults,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 10,
                            filter: function(legendItem, data) {
                                return !data.datasets[legendItem.datasetIndex].hidden;
                            },
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + 
                                       formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Year',
                            font: { size: 14, weight: 'bold' }
                        },
                        grid: { display: false }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value, true);
                            }
                        }
                    }
                }
            }
        });
        
        ChartManager.register('debtPayment', chart);
        window.debtPaymentChart = chart;
        
        // Update function
        window.updateDebtPaymentChart = function() {
            if (!chart || !window.HomeYield.financialOutputs) return;
            
            try {
                const outputs = window.HomeYield.financialOutputs;
                const formDict = window.HomeYield.formDictionary || {};
                
                const investmentYears = formDict['investment-years'] || 20;
                const isAdvanced = document.getElementById('toggle-switch')?.checked || false;
                
                // Determine active debt types
                const helActive = isAdvanced && formDict['use-hel'] === 1;
                const refinanceActive = isAdvanced && formDict['refinance-mortgage'] === 1;
                const refinanceYear = refinanceActive ? parseInt(formDict['refinance-years'] || 5) : null;
                
                // Extra payments flags
                const extraPayments = {
                    im: isAdvanced && formDict['im-extra-payments'] === 1,
                    hel: helActive && formDict['hel-extra-payments'] === 1,
                    rm: refinanceActive && formDict['rm-extra-payments'] === 1
                };
                
                // Prepare year labels
                chart.data.labels = Array.from({ length: investmentYears }, (_, i) => `Year ${i + 1}`);
                
                // Initialize annual arrays
                const annualData = {
                    im: { principal: [], interest: [], extra: [] },
                    rm: { principal: [], interest: [], extra: [] },
                    hel: { principal: [], interest: [], extra: [] }
                };
                
                // Process each year
                for (let year = 0; year < investmentYears; year++) {
                    const startMonth = year * 12 + 1;
                    const endMonth = startMonth + 12;
                    
                    // Initial Mortgage (until refinance)
                    if (!refinanceActive || year < refinanceYear) {
                        annualData.im.principal[year] = sumArray(outputs['IM Principal'] || [], startMonth, endMonth);
                        annualData.im.interest[year] = sumArray(outputs['IM Interest'] || [], startMonth, endMonth);
                        if (extraPayments.im) {
                            annualData.im.extra[year] = sumArray(outputs['IM Extra Payments'] || [], startMonth, endMonth);
                        }
                    }
                    
                    // Refinanced Mortgage (after refinance)
                    if (refinanceActive && year >= refinanceYear) {
                        annualData.rm.principal[year] = sumArray(outputs['RM Principal'] || [], startMonth, endMonth);
                        annualData.rm.interest[year] = sumArray(outputs['RM Interest'] || [], startMonth, endMonth);
                        if (extraPayments.rm) {
                            annualData.rm.extra[year] = sumArray(outputs['RM Extra Payments'] || [], startMonth, endMonth);
                        }
                    }
                    
                    // Home Equity Loan
                    if (helActive) {
                        annualData.hel.principal[year] = sumArray(outputs['HEL Principal'] || [], startMonth, endMonth);
                        annualData.hel.interest[year] = sumArray(outputs['HEL Interest'] || [], startMonth, endMonth);
                        if (extraPayments.hel) {
                            annualData.hel.extra[year] = sumArray(outputs['HEL Extra Payments'] || [], startMonth, endMonth);
                        }
                    }
                }
                
                // Update chart datasets
                const datasetMapping = [
                    { idx: 0, data: annualData.im.principal },
                    { idx: 1, data: annualData.im.interest },
                    { idx: 2, data: annualData.im.extra, hidden: !extraPayments.im },
                    { idx: 3, data: annualData.rm.principal, hidden: !refinanceActive },
                    { idx: 4, data: annualData.rm.interest, hidden: !refinanceActive },
                    { idx: 5, data: annualData.rm.extra, hidden: !extraPayments.rm },
                    { idx: 6, data: annualData.hel.principal, hidden: !helActive },
                    { idx: 7, data: annualData.hel.interest, hidden: !helActive },
                    { idx: 8, data: annualData.hel.extra, hidden: !extraPayments.hel }
                ];
                
                datasetMapping.forEach(({ idx, data, hidden }) => {
                    chart.data.datasets[idx].data = data || [];
                    chart.data.datasets[idx].hidden = hidden || (data?.every(v => v === 0) ?? true);
                });
                
                chart.update();
            } catch (error) {
                console.error('Error updating debt payment chart:', error);
            }
        };
    }

    function sumArray(arr, startIdx, endIdx) {
        if (!Array.isArray(arr)) return 0;
        let sum = 0;
        for (let i = startIdx; i < endIdx && i < arr.length; i++) {
            sum += arr[i] || 0;
        }
        return sum;
    }

    // ========== DEBT BALANCE CHART ==========
    
    function initializeDebtBalanceChart() {
        console.log("Initializing debt balance chart");
        
        const canvas = document.getElementById('debtBalanceChart');
        if (!canvas) {
            console.error("Cannot find debt balance chart canvas");
            return;
        }
        
        ChartManager.destroyChart('debtBalanceChart');
        
        const colors = {
            initialMortgage: 'rgba(255, 99, 132, 0.7)',
            homeEquityLoan: 'rgba(54, 162, 235, 0.7)',
            refinancedMortgage: 'rgba(153, 102, 255, 0.7)'
        };
        
        const chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                ...CONFIG.chartDefaults,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const label = context[0].label;
                                return label === "Close" ? "At Close" : "Year " + label;
                            },
                            label: function(context) {
                                return context.dataset.label + ': ' + 
                                       formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        title: {
                            display: true,
                            text: 'Year',
                            font: { size: 14, weight: 'bold' }
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Remaining Debt Balance ($)',
                            font: { size: 14, weight: 'bold' }
                        },
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value, true);
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                elements: {
                    line: {
                        tension: 0,
                        borderWidth: 2
                    },
                    point: {
                        radius: 3,
                        hoverRadius: 5,
                        hitRadius: 10
                    }
                }
            }
        });
        
        ChartManager.register('debtBalance', chart);
        window.debtBalanceChart = chart;
        
        // Update function
        window.updateDebtBalanceChart = function(financialOutputs) {
            if (!financialOutputs || !chart) return;
            
            try {
                const imBalance = financialOutputs['IM Balance'] || [];
                const helBalance = financialOutputs['HEL Balance'] || [];
                const rmBalance = financialOutputs['RM Balance'] || [];
                
                const investmentYears = window.HomeYield.formDictionary['investment-years'] || 20;
                
                // Create labels
                const labels = ['Close'];
                for (let i = 1; i <= investmentYears; i++) {
                    labels.push(i.toString());
                }
                
                // Extract year-end balances
                const yearEndBalances = {
                    im: [],
                    hel: [],
                    rm: []
                };
                
                for (let year = 0; year <= investmentYears; year++) {
                    const monthIndex = year * 12;
                    yearEndBalances.im[year] = imBalance[monthIndex] || 0;
                    yearEndBalances.hel[year] = helBalance[monthIndex] || 0;
                    yearEndBalances.rm[year] = rmBalance[monthIndex] || 0;
                }
                
                // Create datasets
                const datasets = [];
                
                if (!yearEndBalances.im.every(v => v === 0)) {
                    datasets.push({
                        label: 'Initial Mortgage',
                        data: yearEndBalances.im,
                        borderColor: colors.initialMortgage,
                        backgroundColor: colors.initialMortgage,
                        fill: true
                    });
                }
                
                if (!yearEndBalances.rm.every(v => v === 0)) {
                    datasets.push({
                        label: 'Refinanced Mortgage',
                        data: yearEndBalances.rm,
                        borderColor: colors.refinancedMortgage,
                        backgroundColor: colors.refinancedMortgage,
                        fill: true
                    });
                }
                
                if (!yearEndBalances.hel.every(v => v === 0)) {
                    datasets.push({
                        label: 'Home Equity Loan',
                        data: yearEndBalances.hel,
                        borderColor: colors.homeEquityLoan,
                        backgroundColor: colors.homeEquityLoan,
                        fill: true
                    });
                }
                
                // Update chart
                chart.data.labels = labels;
                chart.data.datasets = datasets;
                chart.update();
                
            } catch (error) {
                console.error("Error updating debt balance chart:", error);
            }
        };
    }

    // ========== TABLES ==========
    
    function updateTables(results) {
        updateEquityTable(results);
        updateCashFlowSpreadsheet(results);
    }

    function updateEquityTable(results) {
        const container = document.getElementById('equity-summary-table-container');
        if (!container || !results.metrics) return;
        
        const metrics = results.metrics;
        const irr = (metrics.xirr * 100).toFixed(2) + '%';
        const moic = metrics.moic.toFixed(2) + 'x';
        
        const rows = [
            { label: 'Internal Rate of Return (IRR)', value: irr },
            { label: 'Multiple on Invested Capital (MOIC)', value: moic },
            { label: 'Total Equity Invested', value: formatCurrency(metrics.totalContributions) },
            { label: 'Total Equity Returned', value: formatCurrency(metrics.totalDistributions) },
            { label: 'Net Profit', value: formatCurrency(metrics.totalDistributions - metrics.totalContributions) }
        ];
        
        let html = '<table class="homeyield-summary-table"><tbody>';
        rows.forEach(row => {
            html += `<tr>
                <td>${row.label}</td>
                <td class="currency-cell">${row.value}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        
        container.innerHTML = html;
    }

    function updateCashFlowSpreadsheet(results) {
        const container = document.getElementById('spreadsheet-container');
        if (!container) return;
        
        const months = window.HomeYield.selectedMonthsToShow;
        const cashFlows = results.cashFlows;
        
        // Create month selector
        let html = `
            <div style="margin-bottom: 20px;">
                <label for="months-selector">Show months: </label>
                <select id="months-selector" style="padding: 5px;">
                    <option value="12" ${months === 12 ? 'selected' : ''}>12 months</option>
                    <option value="24" ${months === 24 ? 'selected' : ''}>24 months</option>
                    <option value="36" ${months === 36 ? 'selected' : ''}>36 months</option>
                    <option value="60" ${months === 60 ? 'selected' : ''}>60 months</option>
                    <option value="all">All months</option>
                </select>
            </div>
        `;
        
        // Create table
        html += '<div style="overflow-x: auto;"><table class="homeyield-summary-table" style="font-size: 12px;"><thead><tr>';
        html += '<th style="position: sticky; left: 0; background: white; z-index: 10;">Month</th>';
        
        const monthsToShow = months === 'all' ? cashFlows.revenues.length : Math.min(months, cashFlows.revenues.length);
        
        for (let i = 0; i < monthsToShow; i++) {
            html += `<th>${i}</th>`;
        }
        html += '</tr></thead><tbody>';
        
        // Add rows
        const rows = [
            { label: 'Rental Income', data: cashFlows.revenues },
            { label: 'Insurance', data: cashFlows.insurance },
            { label: 'Property Tax', data: cashFlows.propertyTax },
            { label: 'HOA', data: cashFlows.hoa },
            { label: 'Maintenance', data: cashFlows.maintenance },
            { label: 'Management Fee', data: cashFlows.managementFee },
            { label: 'Operating Cash Flow', data: cashFlows.operatingCF, bold: true },
            { label: 'Debt Service', data: calculateTotalDebtServiceArray(results.debtService) },
            { label: 'Net Cash Flow', data: cashFlows.leveredCF, bold: true }
        ];
        
        rows.forEach(row => {
            html += `<tr>`;
            html += `<td style="position: sticky; left: 0; background: white; z-index: 10; ${row.bold ? 'font-weight: bold;' : ''}">${row.label}</td>`;
            for (let i = 0; i < monthsToShow; i++) {
                const value = row.data[i] || 0;
                const formatted = formatCurrency(value);
                const color = value < 0 ? 'color: red;' : value > 0 ? 'color: green;' : '';
                html += `<td style="text-align: right; ${color} ${row.bold ? 'font-weight: bold;' : ''}">${formatted}</td>`;
            }
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
        // Add event listener for selector
        const selector = document.getElementById('months-selector');
        if (selector) {
            selector.addEventListener('change', function(e) {
                window.HomeYield.selectedMonthsToShow = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                updateCashFlowSpreadsheet(results);
            });
        }
    }

    function calculateTotalDebtServiceArray(debtService) {
        const months = debtService['Initial Mortgage'].BOP.length;
        const totalService = Array(months).fill(0);
        
        for (let i = 0; i < months; i++) {
            ['Initial Mortgage', 'Home Equity Loan', 'Refinanced Mortgage'].forEach(type => {
                totalService[i] += (debtService[type]['Extra Payments'][i] || 0) +
                                  (debtService[type]['Scheduled Payments'][i] || 0) -
                                  (debtService[type]['Interest Expense'][i] || 0);
            });
        }
        
        return totalService;
    }

    // ========== UTILITY FUNCTIONS ==========
    
    function formatCurrency(value, shortForm = false) {
        if (typeof value !== 'number' || isNaN(value)) return '$0';
        
        const absValue = Math.abs(value);
        let formatted;
        
        if (shortForm) {
            if (absValue >= 1e9) {
                formatted = '$' + (value / 1e9).toFixed(1) + 'B';
            } else if (absValue >= 1e6) {
                formatted = '$' + (value / 1e6).toFixed(1) + 'M';
            } else if (absValue >= 1e3) {
                formatted = '$' + (value / 1e3).toFixed(0) + 'K';
            } else {
                formatted = '$' + absValue.toFixed(0);
            }
        } else {
            formatted = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(absValue);
        }
        
        if (value < 0) {
            formatted = '-' + formatted;
        }
        
        return formatted;
    }

    // ========== INITIALIZATION ==========
    
    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCalculator);
    } else {
        initializeCalculator();
    }

    // Expose public API
    window.HomeYieldCalculator = {
        init: initializeCalculator,
        updateCalculations: updateCalculations,
        getResults: () => window.HomeYield.financialOutputs
    };

})();
