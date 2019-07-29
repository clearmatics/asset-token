# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased (1.3.0)

## [1.2.2] - 2019-07-29

### Changed 

- `granularity` data type from `uint8` to `uint256`

## [1.2.1] - 2019-07-08

Minor modifications after running the [slither] source analyzer

### Changed

- `external` instead of `public` function modifier
- `calldata` instead of `memory` data location of external function parameters
- `private` instead of `public` state variables

## [1.2.0] - 2019-07-04

### Added

- Token granularity to be specified upon deployment
- Check that each amount funded, burnt or transfered is multiple of token granularity, as specified in [ERC777] standard

### Removed

- Fixed token granularity of 1

## [1.1.0] - 2019-07-02

### Added

- Blacklist, Whitelist and NoFilter mode for payment operations
- Switch function to change mode

## [1.0.0] - 2019-06-28

### Added

- [ERC777] token standard support
- [ERC1820] pseudo-introspection registry contract to avoid token loss
- Asset-token [npm-package] creation

### Removed

- [ERC20] token standard support

## [0.9.0] - 2019-05-30

### Added

- [zeppelinOS] framework integration
- [Upgradable] contract through a proxy pattern

### Changed

- `constructor` code is moved into `initialize` public function
- `openzeppelin-solidity` libraries are now imported from `openzeppelin-eth`

[0.9.0]: https://github.com/clearmatics/asset-token/compare/d10f1c03eb1d468df642a24f3c0ffde1e980633a...v0.9.0
[1.0.0]: https://github.com/clearmatics/asset-token/compare/v0.9.0...v1.0.0
[1.1.0]: https://github.com/clearmatics/asset-token/compare/v1.0.0...v1.1.0
[1.2.0]: https://github.com/clearmatics/asset-token/compare/v1.1.0...v1.2.0
[1.2.1]: https://github.com/clearmatics/asset-token/compare/v1.2.0...v1.2.1
[1.2.2]: https://github.com/clearmatics/asset-token/compare/v1.2.1...v1.2.2
[erc777]: https://eips.ethereum.org/EIPS/eip-777
[erc1820]: https://eips.ethereum.org/EIPS/eip-1820
[erc20]: https://eips.ethereum.org/EIPS/eip-20
[npm-package]: https://www.npmjs.com/package/asset-token
[zeppelinos]: https://zeppelinos.org/
[openzeppelin-eth]: https://github.com/OpenZeppelin/openzeppelin-eth
[upgradable]: https://medium.com/clearmatics/upgrading-smart-contracts-c9fb144eceb7
[slither]: https://github.com/crytic/slither
