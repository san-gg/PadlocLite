describe("Signup/Login", () => {
    const email = `sangg@example.com`;

    it("can signup without errors", () => {
        cy.signup(email);
    });

    it("can lock/unlock without errors", () => {
        cy.lock();
        cy.unlock(email);
    });

    it("can relogin without errors", () => {
        cy.relogin(email);
    });
});
