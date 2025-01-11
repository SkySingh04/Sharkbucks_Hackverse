module 0x316c1dcbd2a477e156eba64fa0184903a67e2097a170dbbf16add5b1e66d4b41::MyPaymentModule {
    use std::signer;

    /// Error codes
    const EINSUFFICIENT_BALANCE: u64 = 0;
    const EALREADY_HAS_BALANCE: u64 = 1;
    const EALREADY_FUND: u64 = 2;
    const EEQUAL_ADDR: u64 = 3;

    /// Coin structure (holds the value)
    struct Coin has store {
        value: u64
    }

    /// Startup's balance (how much funding it has received)
    struct StartupBalance has key {
        coin: Coin
    }

    /// Investor's balance (how much they are holding in total)
    struct InvestorBalance has key {
        coin: Coin
    }

    /// Publish the investor balance when they first create an account.
    public entry fun publish_investor_balance(account: &signer) {
        let empty_coin = Coin { value: 0 };
        assert!(!exists<InvestorBalance>(signer::address_of(account)), EALREADY_HAS_BALANCE);
        move_to(account, InvestorBalance { coin: empty_coin });
    }

    public entry fun publish_startup_balance(account: &signer) {
        let empty_coin = Coin { value: 0 };
        assert!(!exists<StartupBalance>(signer::address_of(account)), EALREADY_HAS_BALANCE);
        move_to(account, StartupBalance { coin: empty_coin });
    }

    /// Fund a startup. Transfers `amount` of tokens from the investor to the startup.
    public entry fun fund_startup(investor: &signer, startup_addr: address, amount: u64) acquires InvestorBalance, StartupBalance {
        let investor_addr = signer::address_of(investor);
        assert!(investor_addr != startup_addr, EEQUAL_ADDR);  

        if (!exists<InvestorBalance>(investor_addr)) {
            publish_investor_balance(investor);
        };


        let balance = balance_of_investor(investor_addr);
        assert!(balance >= amount, EINSUFFICIENT_BALANCE);  // Ensure the investor has enough balance

        // Withdraw tokens from investor's balance
        let coin = withdraw_from_investor(investor_addr, amount);

        // Deposit tokens into startup's balance
        deposit_to_startup(startup_addr, coin);
    }

    /// Get the balance of an investor
    public fun balance_of_investor(owner: address): u64 acquires InvestorBalance {
        borrow_global<InvestorBalance>(owner).coin.value
    }

    /// Withdraw tokens from an investor's account
    fun withdraw_from_investor(addr: address, amount: u64): Coin acquires InvestorBalance {
        let balance = balance_of_investor(addr);
        assert!(balance >= amount, EINSUFFICIENT_BALANCE);
        let balance_ref = &mut borrow_global_mut<InvestorBalance>(addr).coin.value;
        *balance_ref = balance - amount;
        Coin { value: amount }
    }

    /// Deposit tokens to the startup's account
    fun deposit_to_startup(addr: address, coin: Coin) acquires StartupBalance {
        let balance = balance_of_startup(addr);
        let balance_ref = &mut borrow_global_mut<StartupBalance>(addr).coin.value;
        let Coin { value } = coin;
        *balance_ref = balance + value;
    }

    /// Get the balance of a startup
    public fun balance_of_startup(owner: address): u64 acquires StartupBalance {
        borrow_global<StartupBalance>(owner).coin.value
    }
}
