// cargo run --example ptb_stats

use std::collections::HashMap;

use eyre::Result;
use iota_sdk::graphql_client::{
    Client,
    pagination::{Direction, PaginationFilter},
    query_types::{TransactionBlockKindInput, TransactionsFilter},
};

/// Maximum number of entries to display in distribution tables.
/// Only the top N most frequent values will be shown.
const MAX_DISTRIBUTION_ENTRIES: usize = 10;
const PAGES_TO_PROCESS: usize = 100;

#[tokio::main]
async fn main() -> Result<()> {
    let client = Client::new_mainnet();

    let mut total_ptbs = 0;
    let mut next_cursor = None;
    let mut page_num = 0;

    // Global stats across all pages
    let mut all_command_counts = Vec::new();
    let mut all_byte_sizes = Vec::new();
    let mut global_cmd_dist: HashMap<usize, usize> = HashMap::new();
    let mut global_byte_dist: HashMap<usize, usize> = HashMap::new();
    let mut first_tx_digest = String::new();
    let mut last_tx_digest = String::new();

    while let Some(cursor) = Some(next_cursor.clone()) {
        page_num += 1;
        let txs_page = client
            .transactions(
                TransactionsFilter {
                    kind: Some(TransactionBlockKindInput::ProgrammableTx),
                    ..Default::default()
                },
                PaginationFilter {
                    cursor,
                    direction: Direction::Backward,
                    ..Default::default()
                },
            )
            .await?;
        let (page_info, data) = txs_page.into_parts();

        // Collect stats for this page
        let mut command_counts = Vec::new();
        let mut byte_sizes = Vec::new();

        for ptb in &data {
            total_ptbs += 1;
            let command_count = ptb
                .transaction
                .as_v1()
                .kind
                .as_programmable_transaction()
                .commands
                .len();
            let byte_size = bcs::to_bytes(&ptb)?.len();

            command_counts.push(command_count);
            byte_sizes.push(byte_size);

            // Add to global stats
            all_command_counts.push(command_count);
            all_byte_sizes.push(byte_size);
            *global_cmd_dist.entry(command_count).or_insert(0) += 1;
            *global_byte_dist.entry(byte_size).or_insert(0) += 1;

            // Track first and last transaction digests
            let digest = ptb.transaction.digest().to_string();
            if first_tx_digest.is_empty() {
                first_tx_digest = digest.clone();
            }
            last_tx_digest = digest;
        }

        // Calculate global stats so far
        if !command_counts.is_empty() {
            let global_avg_commands =
                all_command_counts.iter().sum::<usize>() as f64 / all_command_counts.len() as f64;
            let global_avg_bytes =
                all_byte_sizes.iter().sum::<usize>() as f64 / all_byte_sizes.len() as f64;
            let global_min_commands = *all_command_counts.iter().min().unwrap();
            let global_max_commands = *all_command_counts.iter().max().unwrap();
            let global_min_bytes = *all_byte_sizes.iter().min().unwrap();
            let global_max_bytes = *all_byte_sizes.iter().max().unwrap();

            println!("\nPTBs processed: {total_ptbs}");
            println!("from {first_tx_digest} to {last_tx_digest}");
            println!(
                "Command counts - Min: {}, Max: {}, Avg: {:.2}",
                global_min_commands, global_max_commands, global_avg_commands
            );
            println!(
                "Byte sizes - Min: {}, Max: {}, Avg: {:.2}",
                global_min_bytes, global_max_bytes, global_avg_bytes
            );

            // Global distribution so far
            println!(
                "Command distribution (cumulative - top {}):",
                MAX_DISTRIBUTION_ENTRIES
            );
            let mut global_dist_vec: Vec<_> = global_cmd_dist.iter().collect();
            global_dist_vec.sort_by_key(|(_, freq)| std::cmp::Reverse(*freq));
            for (cmds, freq) in global_dist_vec.iter().take(MAX_DISTRIBUTION_ENTRIES) {
                let global_percentage = (**freq as f64 / total_ptbs as f64) * 100.0;
                println!(
                    "  {} command(s): {} tx ({:.1}% of total)",
                    cmds, freq, global_percentage
                );
            }

            println!(
                "Byte size distribution (cumulative - top {}):",
                MAX_DISTRIBUTION_ENTRIES
            );
            let mut global_byte_dist_vec: Vec<_> = global_byte_dist.iter().collect();
            global_byte_dist_vec.sort_by_key(|(_, freq)| std::cmp::Reverse(*freq));
            for (bytes, freq) in global_byte_dist_vec.iter().take(MAX_DISTRIBUTION_ENTRIES) {
                let global_percentage = (**freq as f64 / total_ptbs as f64) * 100.0;
                println!(
                    "  {} bytes: {} tx ({:.1}% of total)",
                    bytes, freq, global_percentage
                );
            }
        }

        if page_info.has_previous_page && page_num < PAGES_TO_PROCESS {
            next_cursor = page_info.start_cursor.clone();
        } else {
            break;
        }
    }

    Ok(())
}
