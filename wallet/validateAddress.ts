import { isValidIotaAddress } from '@iota/iota-sdk/utils';

const address = '0x9938c94f4118153bbed08f14ae74e2557172542f59bf0b7a306e99d5a0b0896e'
const validAddress = isValidIotaAddress(address);
console.log("Valid IOTA address: " + validAddress)

const addressWithoutHexPrefix = '9938c94f4118153bbed08f14ae74e2557172542f59bf0b7a306e99d5a0b0896e'
console.log("Valid IOTA address: " + isValidIotaAddress(addressWithoutHexPrefix))

console.log("Valid IOTA address: " + isValidIotaAddress('some random string'))
