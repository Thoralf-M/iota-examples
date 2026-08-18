# view_demo — calling `#[view]` functions with curl

The package is published on devnet and testnet; pick one set of IDs:

```sh
# devnet
RPC=https://api.devnet.iota.cafe
GRAPHQL=https://graphql.devnet.iota.cafe
PKG=0xfdcbbed98d46681a530a89eca949e8b51097dce2a80abe3341201b59dc4f4901
SHOP=0x12ff1ea7244240736fa59b92a67d4ca57a5b9c3c279d15037dcb7d2bf8c995b9     # view_demo::shop::Shop (shared)
BOX_U64=0xd61c4a55124a43af9837770f44a96693bfdd7ac3fa1e4a577b0998abed44849c  # view_demo::generics::Box<u64> (shared)
BOX_STR=0x2de3b2f85d8b04c7dac547f49a8ad08a7b31f54f14fc62f3d96a2a1b7a84973c  # view_demo::generics::Box<0x1::string::String> (shared)
OWNER=0xa6244dca21b81a1aed506f9c32d88ded356166855942d04065a1a67a83926f93   # the publisher, and so the shop owner

# testnet
RPC=https://api.testnet.iota.cafe
GRAPHQL=https://graphql.testnet.iota.cafe
PKG=0x533074f8e22e8ce1330d7e9d67c18966abb5a3d58dc2e2deea50e50bea4e87f4
SHOP=0x9d5ce0da7531d56ffecced5efb7e19ccad0e191071041267cc8134a3e5a6cd20     # view_demo::shop::Shop (shared)
BOX_U64=0x4fe1047b6df70b6f5993f77cc688356bdd5cb275fb1814e668a363f3478828c1  # view_demo::generics::Box<u64> (shared)
BOX_STR=0x99b1831e9d675912d86d8d0cf15da87b38c99d84322f37eaa79c396e2c683283  # view_demo::generics::Box<0x1::string::String> (shared)
OWNER=0x677509a75ec1e28b477a2ab07c6b8cd95177b5a03e77221048667e129e65366f   # the publisher, and so the shop owner

view() { curl -s $RPC -H 'Content-Type: application/json' -d "{
  \"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"iota_view\",
  \"params\":[\"$PKG::$1\", $2, $3]}" | jq -c '.result.functionReturnValues // .result // .error'; }
```

`iota_view` params: `[functionName, typeArgs, arguments]`. Objects are passed by ID, `u64` as string.

```sh
# pure function, primitive args                        → ["75"]
view shop::discounted_price '[]' '["100","25"]'

# primitive return                                     → ["4000"]
view shop::total_revenue '[]' "[\"$SHOP\"]"

# reference return (&String)                           → ["IOTA Merch Store"]
view shop::name '[]' "[\"$SHOP\"]"

# vector return                                        → [["1000","2500","500"]]
view shop::sales '[]' "[\"$SHOP\"]"

# Option return: some                                  → ["2500"]
view shop::sale_at '[]' "[\"$SHOP\",\"1\"]"

# Option return: none                                  → [null]
view shop::sale_at '[]' "[\"$SHOP\",\"99\"]"

# struct return                                        → [{"type":"...::shop::ShopSummary","fields":{...}}]
view shop::summary '[]' "[\"$SHOP\"]"

# multiple return values                               → ["4000","3","0x..."]
view shop::stats '[]' "[\"$SHOP\"]"

# address argument                                     → [true]
view shop::is_owner '[]' "[\"$SHOP\",\"$OWNER\"]"

# system object argument (Clock is 0x6)                → ["123456"]
view shop::open_for_ms '[]' "[\"$SHOP\",\"0x6\"]"

# generic, result depends on type arg only             → ["0000...0002::iota::IOTA"]
view generics::type_name_of '["0x2::iota::IOTA"]' '[]'
view generics::type_name_of '["vector<u8>"]' '[]'

# generic value argument                               → ["42"] / [true]
view generics::echo '["u64"]' '["42"]'
view generics::echo '["bool"]' '[true]'

# generic object + matching type arg, &T return        → ["7"] / ["boxed string"]
view generics::boxed_item '["u64"]' "[\"$BOX_U64\"]"
view generics::boxed_item '["0x1::string::String"]' "[\"$BOX_STR\"]"

# calling a non-#[view] function is rejected           → JSON-RPC error -32000
view shop::record_sale '[]' "[\"$SHOP\",\"1\"]"
```

A view that aborts returns `{"executionError":"..."}` instead of `functionReturnValues`.

Same call over GraphQL:

```sh
curl -s $GRAPHQL -H 'Content-Type: application/json' -d "{
  \"query\": \"{ moveViewCall(functionName: \\\"$PKG::shop::total_revenue\\\", typeArgs: [], arguments: [\\\"$SHOP\\\"]) { error results } }\"}" | jq -c .
# → {"data":{"moveViewCall":{"error":null,"results":["4000"]}}}
```
