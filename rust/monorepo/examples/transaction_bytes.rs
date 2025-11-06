// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2024 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

//! This example shows how to use programmable transactions to chain multiple
//! actions into one transaction. Specifically, the example retrieves two
//! addresses from the local wallet, and then
//! 1) finds a coin from the active address that has IOTA,
//! 2) splits the coin into one coin of 1000 NANOS and the rest,
//! 3) transfers the split coin to second IOTA address,
//! 4) signs the transaction and convert it to bytes and back.
//!
//! cargo run --example transaction_bytes

mod utils;

use iota_config::{IOTA_KEYSTORE_FILENAME, iota_config_dir};
use iota_keys::keystore::{AccountKeystore, FileBasedKeystore};
use iota_sdk::types::{
    programmable_transaction_builder::ProgrammableTransactionBuilder,
    transaction::{Argument, Command, TransactionData},
};
use iota_types::transaction::Transaction;
use shared_crypto::intent::Intent;
use utils::setup_for_write;

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    // 1) Get the IOTA client, the sender and recipient that we will use
    // for the transaction
    let (client, sender, recipient) = setup_for_write().await?;

    let coins = client
        .coin_read_api()
        .get_coins(sender, None, None, None)
        .await?;
    let coin = coins.data.into_iter().next().unwrap();

    let mut ptb = ProgrammableTransactionBuilder::new();
    // 2) Split coin
    // The amount we want in the new coin, 1000 NANOS
    let split_coin_amount = ptb.pure(1000u64)?;
    ptb.command(Command::SplitCoins(
        Argument::GasCoin,
        vec![split_coin_amount],
    ));

    // 3) Transfer the new coin to a different address
    let argument_address = ptb.pure(recipient)?;
    ptb.command(Command::TransferObjects(
        vec![Argument::Result(0)],
        argument_address,
    ));

    let transaction = ptb.finish();

    let gas_budget = 5_000_000;
    let gas_price = client.read_api().get_reference_gas_price().await?;
    // Create the transaction data that will be sent to the network
    let tx_data = TransactionData::new_programmable(
        sender,
        vec![coin.object_ref()],
        transaction,
        gas_budget,
        gas_price,
    );

    // 5) Sign transaction
    let keystore = FileBasedKeystore::new(&iota_config_dir()?.join(IOTA_KEYSTORE_FILENAME))?;
    let signature = keystore.sign_secure(&sender, &tx_data, Intent::iota_transaction())?;

    let transaction = Transaction::from_data(tx_data, vec![signature]);

    let tx_bytes = bcs::to_bytes(&transaction)?;
    println!("Transaction bytes:\n{tx_bytes:?}");

    let transaction = bcs::from_bytes::<iota_types::transaction::Transaction>(&tx_bytes)?;
    println!("Transaction decoded again:\n{transaction:?}");

    Ok(())
}
