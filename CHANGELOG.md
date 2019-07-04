# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased (1.3.0)

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

## [1.0.0] - 2019-07-28

### Added

- [ERC777] token standard support
- [ERC1820] pseudo-introspection registry contract to avoid token loss
- Asset-token [npm-package] creation

### Removed

- [ERC20] token standard support

[1.0.0]: https://github.com/clearmatics/asset-token/compare/1e7ef2fbd8ebd744ee0cbcfdfa283f646829fcae...v1.0.0
[1.1.0]: https://github.com/clearmatics/asset-token/compare/v1.0.0...v1.1.0
[1.2.0]: https://github.com/clearmatics/asset-token/compare/v1.1.0...v1.2.0
[erc777]: https://eips.ethereum.org/EIPS/eip-777
[erc1820]: https://eips.ethereum.org/EIPS/eip-1820
[erc20]: https://eips.ethereum.org/EIPS/eip-20
[npm-package]: https://www.npmjs.com/package/asset-token
