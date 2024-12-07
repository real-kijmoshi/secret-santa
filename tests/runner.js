require('dotenv').config();

class TerminalUI {
    static COLORS = {
        RESET: '\x1b[0m',
        BRIGHT: '\x1b[1m',
        DIM: '\x1b[2m',
        
        // Foreground Colors
        FG: {
            BLACK: '\x1b[30m',
            RED: '\x1b[31m',
            GREEN: '\x1b[32m',
            YELLOW: '\x1b[33m',
            BLUE: '\x1b[34m',
            MAGENTA: '\x1b[35m',
            CYAN: '\x1b[36m',
            WHITE: '\x1b[37m'
        },

        // Background Colors
        BG: {
            GREEN: '\x1b[42m',
            RED: '\x1b[41m',
            YELLOW: '\x1b[43m',
            BLUE: '\x1b[44m'
        }
    };

    static progressBar(completed, total, width = 30) {
        const filled = Math.floor((completed / total) * width);
        const empty = width - filled;
        
        const filledBar = '█'.repeat(filled);
        const emptyBar = '░'.repeat(empty);
        
        return `[${filledBar}${emptyBar}]`;
    }

    static renderHeader() {
        const headerArt = `
 ╔═══════════════════════════════════╗
 ║    🚀 API Test Runner v2.0 🧪    ║
 ╚═══════════════════════════════════╝
`;
        console.log(
            `${this.COLORS.BRIGHT}${this.COLORS.FG.CYAN}${headerArt}${this.COLORS.RESET}`
        );
    }

    static renderTestResult(status, description, details = '') {
        const statusIcons = {
            pass: `${this.COLORS.FG.GREEN}✓${this.COLORS.RESET}`,
            fail: `${this.COLORS.FG.RED}✗${this.COLORS.RESET}`,
            skip: `${this.COLORS.FG.YELLOW}?${this.COLORS.RESET}`
        };

        const statusColor = status === 'pass' 
            ? this.COLORS.FG.GREEN 
            : status === 'fail' 
            ? this.COLORS.FG.RED 
            : this.COLORS.FG.YELLOW;

        console.log(
            `${statusIcons[status]} ${statusColor}${description}${this.COLORS.RESET}` +
            (details ? ` ${this.COLORS.DIM}(${details})${this.COLORS.RESET}` : '')
        );
    }

    static renderSummary(tests) {
        const { total, passed, failed, duration, passRate } = tests;

        console.log('\n' + this.COLORS.BRIGHT + 'Test Summary:' + this.COLORS.RESET);
        
        console.log(`${this.COLORS.FG.GREEN}Passed:${this.COLORS.RESET} ${passed} tests`);
        console.log(`${this.COLORS.FG.RED}Failed:${this.COLORS.RESET} ${failed} tests`);
        console.log(`Total: ${total} tests`);
        
        
        console.log(`\n${this.COLORS.FG.CYAN}Duration:${this.COLORS.RESET} ${duration.toFixed(2)}s`);
    }
}

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            duration: 0
        };
        this.tmp = {};
    }

    it(description, testFn, expected, expectedType = 'equal') {
        this.tests.push({ description, testFn, expected, expectedType });
        return this;
    }

    async runTests() {
        console.clear();
        TerminalUI.renderHeader();

        const startTime = Date.now();
        this.results.total = this.tests.length;

        for (const test of this.tests) {
            try {
                const result = await test.testFn();
                const passed = this.validateResult(result, test.expected, test.expectedType);

                if (passed) {
                    TerminalUI.renderTestResult('pass', test.description);
                    this.results.passed++;
                } else {
                    TerminalUI.renderTestResult('fail', test.description, 
                        `Expected ${JSON.stringify(test.expected)}, got ${JSON.stringify(result)}`);
                    this.results.failed++;
                }
            } catch (error) {
                TerminalUI.renderTestResult('fail', test.description, error.message);
                this.results.failed++;
            }
        }

        this.results.duration = (Date.now() - startTime) / 1000;
        this.results.passRate = ((this.results.passed / this.results.total) * 100).toFixed(2);

        TerminalUI.renderSummary(this.results);

        process.exit(this.results.failed > 0 ? 1 : 0);
    }

    validateResult(result, expected, expectedType) {
        switch (expectedType) {
            case 'equal':
                return result === expected;
            case 'between':
                return Array.isArray(expected) && expected.includes(result);
            case 'type':
                return typeof result === expected;
            default:
                return false;
        }
    }
}

module.exports = { TestRunner, TerminalUI };