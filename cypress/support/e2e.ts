// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

/// <reference types="cypress" />

declare global {
    namespace Cypress {
        interface Chainable {
            doWithin(path: string[], fn: () => void, delay?: number): Chainable<void>;

            typeWithin(selector: string, text: string, options?: any): Chainable<void>;

            /**
             * Clear all emails from maildev smtp server
             */
            clearEmails(): Chainable<Response<unknown>>;

            /**
             * Custom command to run all the steps to signup.
             * @example cy.signup()
             */
            signup(email: string): Chainable<void>;

            /**
             * Custom command to run all the steps to login.
             * @example cy.login()
             */
            relogin(email: string): Chainable<void>;

            /**
             * Custom command to run all the steps to lock the app.
             * @example cy.lock()
             */
            lock(): Chainable<Element>;

            /**
             * Custom command to run all the steps to unlock the app.
             * @example cy.unlock()
             */
            unlock(email: string): Chainable<Element>;
        }
    }
}

import "./commands";
