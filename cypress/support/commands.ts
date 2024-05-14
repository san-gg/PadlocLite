Cypress.Commands.add("doWithin", ([first, ...rest]: string[], fn: () => void, delay: number = 0) => {
    cy.wait(delay);
    cy.get(first).within(() => {
        if (rest.length) {
            cy.doWithin(rest, fn);
        } else {
            fn();
        }
    });
});

Cypress.Commands.add("typeWithin", (selector, text, options) => {
    cy.get(selector).within(() => cy.get("input, textarea").type(text, options));
});

Cypress.Commands.add("signup", (email: string) => {
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();

    cy.visit("/");

    const { password, name } = Cypress.env();

    cy.doWithin(["pl-app", "pl-start", "pl-login-signup"], () => {
        cy.typeWithin("pl-input#emailInput", email);
        cy.get("pl-button#submitEmailButton").click({ force: true });
    });

    cy.doWithin(["pl-app", "pl-start", "pl-login-signup"], () => {
        // Enter name
        cy.typeWithin("pl-drawer:eq(2) pl-input", name, { force: true });

        // Continue
        cy.get("pl-button:eq(2)").click({ force: true });
    });

    // SanGG Consent
    cy.doWithin(["pl-app", "pl-alert-dialog"], () => cy.get("pl-button").click({ force: true }), 200);

    cy.doWithin(["pl-app", "pl-start", "pl-login-signup"], () =>
        cy.get("pl-drawer:eq(5) pl-button:eq(1)").click({ force: true })
    );

    // Choose my own
    cy.doWithin(["pl-app", "pl-alert-dialog"], () => cy.get("pl-button:eq(2)").click({ force: true }), 200);

    // Type master password
    cy.doWithin(
        ["pl-app", "pl-prompt-dialog"],
        () => {
            cy.typeWithin("pl-input[label='Enter Master Password']", password, { force: true });
            cy.get("pl-button#confirmButton").click({ force: true });
        },
        200
    );

    // Confirm weak password
    cy.doWithin(["pl-app", "pl-alert-dialog"], () => cy.get("pl-button:eq(1)").click({ force: true }), 200);

    cy.doWithin(["pl-app", "pl-start", "pl-login-signup"], () => {
        // Continue signup
        cy.get("pl-drawer:eq(5) pl-button:eq(3)").click({ force: true });

        // Repeat master password
        cy.typeWithin("pl-drawer:eq(6) pl-password-input#repeatPasswordInput", password, { force: true });

        // Continue signup
        cy.get("pl-drawer:eq(6) pl-button#confirmPasswordButton").click({ force: true });

        // Wait for success
        cy.url({ timeout: 10000 }).should("include", "/signup/success");

        // Done!
        cy.get("pl-drawer:eq(7) pl-button").click({ force: true });
    });

    cy.url().should("include", "/items");
});

Cypress.Commands.add("relogin", (email: string) => {
    cy.lock();

    cy.doWithin(["pl-unlock", "pl-input"], () => cy.get("pl-button").click({ force: true }), 200);

    cy.doWithin(
        ["pl-unlock", "pl-input", "pl-popover", "pl-list"],
        () =>
            cy
                .get('div[class="small double-padded list-item center-aligning spacing horizontal layout hover click"]')
                .click({ force: true }),
        200
    );

    cy.doWithin(["pl-app", "pl-alert-dialog"], () => cy.get("pl-button:eq(1)").click({ force: true }), 200);

    const { password } = Cypress.env();

    cy.doWithin(["pl-app", "pl-start", "pl-login-signup"], () => {
        cy.typeWithin("pl-input#emailInput", email, { force: true });
        cy.get("pl-button#submitEmailButton").click({ force: true });
        cy.typeWithin("pl-drawer:eq(3) pl-password-input#loginPasswordInput", password, { force: true });
        cy.get("pl-drawer:eq(3) pl-button#loginButton").click({ force: true });
    });

    cy.url({ timeout: 10000 }).should("include", "/items");
});

Cypress.Commands.add("lock", () => {
    // Open menu
    cy.doWithin(["pl-app", "pl-items", "pl-items-list"], () => {
        cy.get("pl-button.menu-button:eq(0)").click({ force: true });
    });

    // Click lock
    cy.doWithin(["pl-app", "pl-menu"], () => cy.get("pl-button.menu-footer-button:eq(0)").click({ force: true }));

    cy.url().should("include", "/unlock");
});

Cypress.Commands.add("unlock", (email: string) => {
    const { password } = Cypress.env();

    cy.doWithin(
        ["pl-app", "pl-start", "pl-unlock"],
        () => {
            cy.get("pl-input[label='Logged In As']").find("input").should("have.value", email);

            cy.typeWithin("pl-password-input#passwordInput", password, { force: true });

            cy.get("pl-button#unlockButton").click({ force: true });
        },
        1000
    );

    cy.url().should("include", "/items");
});
