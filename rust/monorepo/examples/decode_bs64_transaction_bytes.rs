//! cargo run --example decode_bs64_transaction_bytes

use base64::Engine;
use iota_types::transaction::TransactionData;

fn main() -> Result<(), anyhow::Error> {
    let tx_base64 = "AAACAAiA2Z84AAAAAAAg7fH4Ywjr4fGmiF8G2YrmmOFekhsn3AnS8g7MGsHPRyECAgABAQAAAQECAAABAQA1S+/pDUbRVQKBq7M1SrpdeJgWWRqJhqH11sb+h4K3SwF69/uuMKgDdEpr+DklKDsYgeMV67FwDESbG+T4EZDTLbMjkQAAAAAAIGUiSJpvjQAnR/IoTg8uPtubEY1Ahlb6Kt3W8/bgmfGXNUvv6Q1G0VUCgauzNUq6XXiYFlkaiYah9dbG/oeCt0voAwAAAAAAAIDw+gIAAAAAAA==";
    let tx_bytes = Engine::decode(&base64::engine::general_purpose::STANDARD, tx_base64)?;

    let transaction = bcs::from_bytes::<TransactionData>(&tx_bytes)?;
    println!("Transaction decoded:\n{transaction:#?}");

    Ok(())
}
