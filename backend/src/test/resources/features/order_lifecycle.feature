Feature: OrderFlow E-Commerce Checkout and State Machine Lifecycle
  As a registered user of OrderFlow
  I want to purchase a product and manage its lifecycle states
  So that I can verify secure checkout and status transitions

  Scenario: Complete order placement and state machine transitions
    Given I am logged into OrderFlow with "testuser@orderflow.com" and "mypassword123"
    When I add a product to the cart from the storefront
    And I proceed to secure checkout
    Then the order should be successfully created in the orders view
    When I advance the order state to "SHIPPED"
    Then the order status badge should display "SHIPPED"
    When I advance the order state to "DELIVERED"
    Then the order status badge should display "DELIVERED"