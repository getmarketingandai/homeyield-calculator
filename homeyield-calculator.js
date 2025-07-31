/**
 * HomeYield Real Estate Investment Calculator
 * Version: 1.0.0
 * 
 * This script contains all functionality for the HomeYield calculator
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
        document.querySelectorAll('.collapsible-header').forEach(header => {
            header.addEventListener('click', function(e) {
                e.preventDefault();
                const checkbox = this.previousElementSibling;
                const content = this.nextElementSibling;
                const icon = this.querySelector('.collapsible-icon');
                
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
        document.querySelectorAll('.info-icon').forEach(icon => {
            let tooltip = null;
            
            icon.addEventListener('mouseenter', function(e) {
                const text = this.getAttribute('data-tooltip');
                if (!text) return;
                
                tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
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
        updateCharts(results);
        updateTables(results);
        
        // Store results
        window.HomeYield.financialOutputs = results;
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
            propertyValue: Array(months).fill(0)
        };
        
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

    // ========== CHARTS ==========
    
    function initializeCharts() {
        const chartConfigs = [
            {
                id: 'sourcesUsesChart',
                type: 'doughnut',
                options: {
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + formatCurrency(context.raw);
                                }
                            }
                        }
                    }
                }
            },
            {
                id: 'barChart',
                type: 'bar',
                options: {
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + (context.raw * 100).toFixed(2) + '%';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return (value * 100).toFixed(0) + '%';
                                }
                            }
                        }
                    }
                }
            },
            {
                id: 'annualCashFlowChart',
                type: 'bar',
                options: {
                    scales: {
                        x: { stacked: true },
                        y: { 
                            stacked: true,
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + formatCurrency(context.raw);
                                }
                            }
                        }
                    }
                }
            },
            {
                id: 'annualDebtPaymentChart',
                type: 'bar',
                options: {
                    scales: {
                        x: { stacked: true },
                        y: { 
                            stacked: true,
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + formatCurrency(context.raw);
                                }
                            }
                        }
                    }
                }
            },
            {
                id: 'debtBalanceChart',
                type: 'line',
                options: {
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + formatCurrency(context.raw);
                                }
                            }
                        }
                    }
                }
            }
        ];

        chartConfigs.forEach(config => {
            const ctx = document.getElementById(config.id)?.getContext('2d');
            if (ctx) {
                window.HomeYield.charts[config.id] = new Chart(ctx, {
                    type: config.type,
                    data: { labels: [], datasets: [] },
                    options: Object.assign({}, CONFIG.chartDefaults, config.options)
                });
            }
        });
    }

    function updateCharts(results) {
        updateSourcesUsesChart();
        updateMarketComparisonChart(results.cashFlows.propertyValue);
        updateAnnualCashFlowChart(results.cashFlows);
        updateDebtPaymentChart(results.debtService);
        updateDebtBalanceChart(results.debtService);
    }

    function updateSourcesUsesChart() {
        const chart = window.HomeYield.charts.sourcesUsesChart;
        if (!chart) return;
        
        const data = window.HomeYield.sourcesAndUses;
        
        chart.data = {
            labels: ['Equity', 'Initial Mortgage', 'Home Equity Loan'],
            datasets: [{
                data: [data.equity, data.initialMortgage, data.hel],
                backgroundColor: [CONFIG.colors.primary, CONFIG.colors.secondary, CONFIG.colors.accent1]
            }]
        };
        
        chart.update();
        
        // Update table
        updateSourcesUsesTable(data);
    }

    function updateSourcesUsesTable(data) {
        const tableContainer = document.getElementById('table-container');
        if (!tableContainer) return;
        
        const sources = [
            { label: 'Equity', value: data.equity, color: CONFIG.colors.primary },
            { label: 'Initial Mortgage', value: data.initialMortgage, color: CONFIG.colors.secondary },
            { label: 'Home Equity Loan', value: data.hel, color: CONFIG.colors.accent1 }
        ];
        
        const uses = [
            { label: 'Purchase Price', value: data.purchasePrice },
            { label: 'Closing Costs', value: data.closingCosts },
            { label: 'Financing Costs', value: data.closingLoanCosts }
        ];
        
        let html = '<table class="summary-table"><tbody>';
        
        // Sources
        html += '<tr><td colspan="2" style="font-weight: bold; background: #f5f5f5;">SOURCES</td></tr>';
        sources.forEach(item => {
            if (item.value > 0) {
                html += `<tr>
                    <td><span class="oval" style="background-color: ${item.color};">${item.label}</span></td>
                    <td class="currency-cell">${formatCurrency(item.value)}</td>
                </tr>`;
            }
        });
        html += `<tr style="font-weight: bold;">
            <td>Total Sources</td>
            <td class="currency-cell">${formatCurrency(data.totalSources)}</td>
        </tr>`;
        
        // Separator
        html += '<tr><td colspan="2" style="height: 20px;"></td></tr>';
        
        // Uses
        html += '<tr><td colspan="2" style="font-weight: bold; background: #f5f5f5;">USES</td></tr>';
        uses.forEach(item => {
            if (item.value > 0) {
                html += `<tr>
                    <td>${item.label}</td>
                    <td class="currency-cell">${formatCurrency(item.value)}</td>
                </tr>`;
            }
        });
        html += `<tr style="font-weight: bold;">
            <td>Total Uses</td>
            <td class="currency-cell">${formatCurrency(data.totalUses)}</td>
        </tr>`;
        
        html += '</tbody></table>';
        tableContainer.innerHTML = html;
    }

    function updateMarketComparisonChart(propertyValues) {
        const chart = window.HomeYield.charts.barChart;
        if (!chart || !window.HomeYield.financialOutputs.metrics) return;
        
        const metrics = window.HomeYield.financialOutputs.metrics;
        const marketReturn = 0.08; // 8% market return assumption
        
        chart.data = {
            labels: ['Your Investment', 'S&P 500'],
            datasets: [{
                data: [metrics.xirr, marketReturn],
                backgroundColor: [CONFIG.colors.primary, '#e0e0e0']
            }]
        };
        
        chart.update();
    }

    function updateAnnualCashFlowChart(cashFlows) {
        const chart = window.HomeYield.charts.annualCashFlowChart;
        if (!chart) return;
        
        const years = Math.ceil(cashFlows.revenues.length / 12);
        const annualData = aggregateToAnnual(cashFlows, years);
        
        chart.data = {
            labels: Array.from({length: years}, (_, i) => `Year ${i + 1}`),
            datasets: [
                {
                    label: 'Rental Income',
                    data: annualData.revenues,
                    backgroundColor: CONFIG.colors.primary
                },
                {
                    label: 'Insurance',
                    data: annualData.insurance,
                    backgroundColor: CONFIG.colors.accent3
                },
                {
                    label: 'Property Tax',
                    data: annualData.propertyTax,
                    backgroundColor: CONFIG.colors.accent2
                },
                {
                    label: 'HOA',
                    data: annualData.hoa,
                    backgroundColor: CONFIG.colors.secondary
                },
                {
                    label: 'Maintenance',
                    data: annualData.maintenance,
                    backgroundColor: CONFIG.colors.accent1
                },
                {
                    label: 'Management Fee',
                    data: annualData.managementFee,
                    backgroundColor: CONFIG.colors.accent4
                }
            ]
        };
        
        chart.update();
    }

    function updateDebtPaymentChart(debtService) {
        const chart = window.HomeYield.charts.annualDebtPaymentChart;
        if (!chart) return;
        
        const years = Math.ceil(debtService['Initial Mortgage'].BOP.length / 12);
        const annualData = aggregateDebtToAnnual(debtService, years);
        
        chart.data = {
            labels: Array.from({length: years}, (_, i) => `Year ${i + 1}`),
            datasets: [
                {
                    label: 'IM Principal',
                    data: annualData.imPrincipal,
                    backgroundColor: CONFIG.colors.primary
                },
                {
                    label: 'IM Interest',
                    data: annualData.imInterest,
                    backgroundColor: CONFIG.colors.secondary
                },
                {
                    label: 'HEL Principal',
                    data: annualData.helPrincipal,
                    backgroundColor: CONFIG.colors.accent1
                },
                {
                    label: 'HEL Interest',
                    data: annualData.helInterest,
                    backgroundColor: CONFIG.colors.accent2
                },
                {
                    label: 'RM Principal',
                    data: annualData.rmPrincipal,
                    backgroundColor: CONFIG.colors.accent3
                },
                {
                    label: 'RM Interest',
                    data: annualData.rmInterest,
                    backgroundColor: CONFIG.colors.accent4
                }
            ]
        };
        
        chart.update();
    }

    function updateDebtBalanceChart(debtService) {
        const chart = window.HomeYield.charts.debtBalanceChart;
        if (!chart) return;
        
        const months = debtService['Initial Mortgage'].EOP.length;
        const monthLabels = Array.from({length: months}, (_, i) => 
            i % 12 === 0 ? `Year ${Math.floor(i/12)}` : ''
        );
        
        chart.data = {
            labels: monthLabels,
            datasets: [
                {
                    label: 'Initial Mortgage',
                    data: debtService['Initial Mortgage'].EOP,
                    borderColor: CONFIG.colors.primary,
                    backgroundColor: CONFIG.colors.primary,
                    fill: false
                },
                {
                    label: 'Home Equity Loan',
                    data: debtService['Home Equity Loan'].EOP,
                    borderColor: CONFIG.colors.secondary,
                    backgroundColor: CONFIG.colors.secondary,
                    fill: false
                },
                {
                    label: 'Refinanced Mortgage',
                    data: debtService['Refinanced Mortgage'].EOP,
                    borderColor: CONFIG.colors.accent1,
                    backgroundColor: CONFIG.colors.accent1,
                    fill: false
                }
            ]
        };
        
        chart.update();
    }

    function aggregateToAnnual(cashFlows, years) {
        const annual = {
            revenues: Array(years).fill(0),
            insurance: Array(years).fill(0),
            propertyTax: Array(years).fill(0),
            hoa: Array(years).fill(0),
            maintenance: Array(years).fill(0),
            managementFee: Array(years).fill(0)
        };
        
        Object.keys(annual).forEach(key => {
            for (let i = 0; i < cashFlows[key].length; i++) {
                const year = Math.floor(i / 12);
                if (year < years) {
                    annual[key][year] += cashFlows[key][i];
                }
            }
        });
        
        return annual;
    }

    function aggregateDebtToAnnual(debtService, years) {
        const annual = {
            imPrincipal: Array(years).fill(0),
            imInterest: Array(years).fill(0),
            helPrincipal: Array(years).fill(0),
            helInterest: Array(years).fill(0),
            rmPrincipal: Array(years).fill(0),
            rmInterest: Array(years).fill(0)
        };
        
        for (let i = 0; i < debtService['Initial Mortgage']['Scheduled Payments'].length; i++) {
            const year = Math.floor(i / 12);
            if (year < years) {
                annual.imPrincipal[year] += Math.abs(debtService['Initial Mortgage']['Scheduled Payments'][i] || 0);
                annual.imInterest[year] += debtService['Initial Mortgage']['Interest Expense'][i] || 0;
                annual.helPrincipal[year] += Math.abs(debtService['Home Equity Loan']['Scheduled Payments'][i] || 0);
                annual.helInterest[year] += debtService['Home Equity Loan']['Interest Expense'][i] || 0;
                annual.rmPrincipal[year] += Math.abs(debtService['Refinanced Mortgage']['Scheduled Payments'][i] || 0);
                annual.rmInterest[year] += debtService['Refinanced Mortgage']['Interest Expense'][i] || 0;
            }
        }
        
        return annual;
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
        
        let html = '<table class="summary-table"><tbody>';
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
        html += '<div style="overflow-x: auto;"><table class="summary-table" style="font-size: 12px;"><thead><tr>';
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
    
    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
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
