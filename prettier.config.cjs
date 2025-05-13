// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module.exports = {
    printWidth: 100,
    semi: true,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'all',
    useTabs: false,
    plugins: ['@ianvs/prettier-plugin-sort-imports'],
    importOrder: [
        '<BUILT_IN_MODULES>',
        '<THIRD_PARTY_MODULES>',
        '',
        '^@/(.*)$',
        '^~/(.*)$',
        '',
        '^[.]',
    ],
};
