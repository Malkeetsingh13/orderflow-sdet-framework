package com.orderflow.steps;

import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.en.*;
import org.junit.jupiter.api.Assertions;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class OrderSteps {
    private WebDriver driver;
    private WebDriverWait wait;

    @Before
    public void setUp() {
        // Selenium 4 natively handles ChromeDriver via Selenium Manager
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        driver.get("http://localhost:5173");
    }

    @After
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Given("I am logged into OrderFlow with {string} and {string}")
    public void i_am_logged_into_order_flow(String email, String password) {
        WebElement signInBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(text(), 'Sign In')]")));
        signInBtn.click();

        WebElement emailInput = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//input[@type='email']")));
        WebElement passwordInput = driver.findElement(By.xpath("//input[@type='password']"));

        emailInput.clear();
        emailInput.sendKeys(email);
        passwordInput.clear();
        passwordInput.sendKeys(password);

        WebElement submitBtn = driver.findElement(By.xpath("//button[@type='submit' and contains(text(), 'Sign In')]"));
        submitBtn.click();
    }

    @When("I add a product to the cart from the storefront")
    public void i_add_a_product_to_the_cart() {
        WebElement storefrontBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(text(), 'Storefront')]")));
        storefrontBtn.click();

        WebElement addToCartBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(text(), 'Add to cart')]")));
        addToCartBtn.click();
    }

    @And("I proceed to secure checkout")
    public void i_proceed_to_secure_checkout() {
        WebElement cartBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(text(), 'Cart')]")));
        cartBtn.click();

        WebElement checkoutBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(text(), 'Proceed to Secure Checkout')]")));
        checkoutBtn.click();
    }

    @Then("the order should be successfully created in the orders view")
    public void the_order_should_be_successfully_created() {
        WebElement ordersHeader = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//h2[contains(text(), 'Order History & State Lifecycle Management')]")));
        Assertions.assertTrue(ordersHeader.isDisplayed(), "Failed to reach Orders view after checkout!");
    }

    @When("I advance the order state to {string}")
    public void i_advance_the_order_state_to(String targetStatus) {
        String xpath = targetStatus.equals("SHIPPED") ? "//button[contains(text(), 'SHIPPED 🚚')]" : "//button[contains(text(), 'DELIVERED ✨')]";
        WebElement stateBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath(xpath)));
        stateBtn.click();
    }

    @Then("the order status badge should display {string}")
    public void the_order_status_badge_should_display(String expectedStatus) {
        String badgeXpath = "//span[contains(text(), 'Status: " + expectedStatus + "')]";
        WebElement badge = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath(badgeXpath)));
        Assertions.assertTrue(badge.isDisplayed(), "Status badge for " + expectedStatus + " is not visible!");
    }
}