[
    {
      "type": "impl",
      "name": "ExternalImpl",
      "interface_name": "strkfarm_contracts::strategies::vesu_rebalance::interface::IVesuRebal"
    },
    {
      "type": "enum",
      "name": "strkfarm_contracts::strategies::vesu_rebalance::interface::Feature",
      "variants": [
        {
          "name": "DEPOSIT",
          "type": "()"
        },
        {
          "name": "WITHDRAW",
          "type": "()"
        }
      ]
    },
    {
      "type": "struct",
      "name": "core::integer::u256",
      "members": [
        {
          "name": "low",
          "type": "core::integer::u128"
        },
        {
          "name": "high",
          "type": "core::integer::u128"
        }
      ]
    },
    {
      "type": "struct",
      "name": "strkfarm_contracts::strategies::vesu_rebalance::interface::Action",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252"
        },
        {
          "name": "feature",
          "type": "strkfarm_contracts::strategies::vesu_rebalance::interface::Feature"
        },
        {
          "name": "token",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "amount",
          "type": "core::integer::u256"
        }
      ]
    },
    {
      "type": "struct",
      "name": "strkfarm_contracts::interfaces::IEkuboDistributor::Claim",
      "members": [
        {
          "name": "id",
          "type": "core::integer::u64"
        },
        {
          "name": "claimee",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "amount",
          "type": "core::integer::u128"
        }
      ]
    },
    {
      "type": "struct",
      "name": "core::array::Span::<core::felt252>",
      "members": [
        {
          "name": "snapshot",
          "type": "@core::array::Array::<core::felt252>"
        }
      ]
    },
    {
      "type": "struct",
      "name": "strkfarm_contracts::components::swap::Route",
      "members": [
        {
          "name": "token_from",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "token_to",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "exchange_address",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "percent",
          "type": "core::integer::u128"
        },
        {
          "name": "additional_swap_params",
          "type": "core::array::Array::<core::felt252>"
        }
      ]
    },
    {
      "type": "struct",
      "name": "strkfarm_contracts::components::swap::AvnuMultiRouteSwap",
      "members": [
        {
          "name": "token_from_address",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "token_from_amount",
          "type": "core::integer::u256"
        },
        {
          "name": "token_to_address",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "token_to_amount",
          "type": "core::integer::u256"
        },
        {
          "name": "token_to_min_amount",
          "type": "core::integer::u256"
        },
        {
          "name": "beneficiary",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "integrator_fee_amount_bps",
          "type": "core::integer::u128"
        },
        {
          "name": "integrator_fee_recipient",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "routes",
          "type": "core::array::Array::<strkfarm_contracts::components::swap::Route>"
        }
      ]
    },
    {
      "type": "struct",
      "name": "strkfarm_contracts::strategies::vesu_rebalance::interface::Settings",
      "members": [
        {
          "name": "default_pool_index",
          "type": "core::integer::u8"
        },
        {
          "name": "fee_bps",
          "type": "core::integer::u32"
        },
        {
          "name": "fee_receiver",
          "type": "core::starknet::contract_address::ContractAddress"
        }
      ]
    },
    {
      "type": "struct",
      "name": "strkfarm_contracts::strategies::vesu_rebalance::interface::PoolProps",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252"
        },
        {
          "name": "max_weight",
          "type": "core::integer::u32"
        },
        {
          "name": "v_token",
          "type": "core::starknet::contract_address::ContractAddress"
        }
      ]
    },
    {
      "type": "interface",
      "name": "strkfarm_contracts::strategies::vesu_rebalance::interface::IVesuRebal",
      "items": [
        {
          "type": "function",
          "name": "rebalance",
          "inputs": [
            {
              "name": "actions",
              "type": "core::array::Array::<strkfarm_contracts::strategies::vesu_rebalance::interface::Action>"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "rebalance_weights",
          "inputs": [
            {
              "name": "actions",
              "type": "core::array::Array::<strkfarm_contracts::strategies::vesu_rebalance::interface::Action>"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "emergency_withdraw",
          "inputs": [],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "emergency_withdraw_pool",
          "inputs": [
            {
              "name": "pool_index",
              "type": "core::integer::u32"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "compute_yield",
          "inputs": [],
          "outputs": [
            {
              "type": "(core::integer::u256, core::integer::u256)"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "harvest",
          "inputs": [
            {
              "name": "rewardsContract",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "claim",
              "type": "strkfarm_contracts::interfaces::IEkuboDistributor::Claim"
            },
            {
              "name": "proof",
              "type": "core::array::Span::<core::felt252>"
            },
            {
              "name": "swapInfo",
              "type": "strkfarm_contracts::components::swap::AvnuMultiRouteSwap"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "set_settings",
          "inputs": [
            {
              "name": "settings",
              "type": "strkfarm_contracts::strategies::vesu_rebalance::interface::Settings"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "set_allowed_pools",
          "inputs": [
            {
              "name": "pools",
              "type": "core::array::Array::<strkfarm_contracts::strategies::vesu_rebalance::interface::PoolProps>"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "set_incentives_off",
          "inputs": [],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "get_settings",
          "inputs": [],
          "outputs": [
            {
              "type": "strkfarm_contracts::strategies::vesu_rebalance::interface::Settings"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "get_allowed_pools",
          "inputs": [],
          "outputs": [
            {
              "type": "core::array::Array::<strkfarm_contracts::strategies::vesu_rebalance::interface::PoolProps>"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "get_previous_index",
          "inputs": [],
          "outputs": [
            {
              "type": "core::integer::u128"
            }
          ],
          "state_mutability": "view"
        }
      ]
    },
    {
      "type": "impl",
      "name": "VesuERC4626Impl",
      "interface_name": "strkfarm_contracts::interfaces::IERC4626::IERC4626"
    },
    {
      "type": "interface",
      "name": "strkfarm_contracts::interfaces::IERC4626::IERC4626",
      "items": [
        {
          "type": "function",
          "name": "asset",
          "inputs": [],
          "outputs": [
            {
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "total_assets",
          "inputs": [],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "convert_to_shares",
          "inputs": [
            {
              "name": "assets",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "convert_to_assets",
          "inputs": [
            {
              "name": "shares",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "max_deposit",
          "inputs": [
            {
              "name": "receiver",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "preview_deposit",
          "inputs": [
            {
              "name": "assets",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "deposit",
          "inputs": [
            {
              "name": "assets",
              "type": "core::integer::u256"
            },
            {
              "name": "receiver",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "max_mint",
          "inputs": [
            {
              "name": "receiver",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "preview_mint",
          "inputs": [
            {
              "name": "shares",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "mint",
          "inputs": [
            {
              "name": "shares",
              "type": "core::integer::u256"
            },
            {
              "name": "receiver",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "max_withdraw",
          "inputs": [
            {
              "name": "owner",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "preview_withdraw",
          "inputs": [
            {
              "name": "assets",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "withdraw",
          "inputs": [
            {
              "name": "assets",
              "type": "core::integer::u256"
            },
            {
              "name": "receiver",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "owner",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "max_redeem",
          "inputs": [
            {
              "name": "owner",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "preview_redeem",
          "inputs": [
            {
              "name": "shares",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "redeem",
          "inputs": [
            {
              "name": "shares",
              "type": "core::integer::u256"
            },
            {
              "name": "receiver",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "owner",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "external"
        }
      ]
    },
    {
      "type": "impl",
      "name": "VesuERC20Impl",
      "interface_name": "openzeppelin_token::erc20::interface::IERC20Mixin"
    },
    {
      "type": "enum",
      "name": "core::bool",
      "variants": [
        {
          "name": "False",
          "type": "()"
        },
        {
          "name": "True",
          "type": "()"
        }
      ]
    },
    {
      "type": "struct",
      "name": "core::byte_array::ByteArray",
      "members": [
        {
          "name": "data",
          "type": "core::array::Array::<core::bytes_31::bytes31>"
        },
        {
          "name": "pending_word",
          "type": "core::felt252"
        },
        {
          "name": "pending_word_len",
          "type": "core::integer::u32"
        }
      ]
    },
    {
      "type": "interface",
      "name": "openzeppelin_token::erc20::interface::IERC20Mixin",
      "items": [
        {
          "type": "function",
          "name": "total_supply",
          "inputs": [],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "balance_of",
          "inputs": [
            {
              "name": "account",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "allowance",
          "inputs": [
            {
              "name": "owner",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "spender",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "transfer",
          "inputs": [
            {
              "name": "recipient",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "amount",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::bool"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "transfer_from",
          "inputs": [
            {
              "name": "sender",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "recipient",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "amount",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::bool"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "approve",
          "inputs": [
            {
              "name": "spender",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "amount",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::bool"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "name",
          "inputs": [],
          "outputs": [
            {
              "type": "core::byte_array::ByteArray"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "symbol",
          "inputs": [],
          "outputs": [
            {
              "type": "core::byte_array::ByteArray"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "decimals",
          "inputs": [],
          "outputs": [
            {
              "type": "core::integer::u8"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "totalSupply",
          "inputs": [],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "balanceOf",
          "inputs": [
            {
              "name": "account",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "transferFrom",
          "inputs": [
            {
              "name": "sender",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "recipient",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "amount",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::bool"
            }
          ],
          "state_mutability": "external"
        }
      ]
    },
    {
      "type": "impl",
      "name": "CommonCompImpl",
      "interface_name": "strkfarm_contracts::interfaces::common::ICommon"
    },
    {
      "type": "interface",
      "name": "strkfarm_contracts::interfaces::common::ICommon",
      "items": [
        {
          "type": "function",
          "name": "upgrade",
          "inputs": [
            {
              "name": "new_class",
              "type": "core::starknet::class_hash::ClassHash"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "pause",
          "inputs": [],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "unpause",
          "inputs": [],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "is_paused",
          "inputs": [],
          "outputs": [
            {
              "type": "core::bool"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "access_control",
          "inputs": [],
          "outputs": [
            {
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "state_mutability": "view"
        }
      ]
    },
    {
      "type": "impl",
      "name": "RewardShareImpl",
      "interface_name": "strkfarm_contracts::components::harvester::reward_shares::IRewardShare"
    },
    {
      "type": "struct",
      "name": "strkfarm_contracts::components::harvester::reward_shares::UserRewardsInfo",
      "members": [
        {
          "name": "pending_round_points",
          "type": "core::integer::u128"
        },
        {
          "name": "shares_owned",
          "type": "core::integer::u128"
        },
        {
          "name": "block_number",
          "type": "core::integer::u64"
        },
        {
          "name": "index",
          "type": "core::integer::u32"
        }
      ]
    },
    {
      "type": "struct",
      "name": "strkfarm_contracts::components::harvester::reward_shares::RewardsInfo",
      "members": [
        {
          "name": "amount",
          "type": "core::integer::u128"
        },
        {
          "name": "shares",
          "type": "core::integer::u128"
        },
        {
          "name": "total_round_points",
          "type": "core::integer::u128"
        },
        {
          "name": "block_number",
          "type": "core::integer::u64"
        }
      ]
    },
    {
      "type": "interface",
      "name": "strkfarm_contracts::components::harvester::reward_shares::IRewardShare",
      "items": [
        {
          "type": "function",
          "name": "get_user_reward_info",
          "inputs": [
            {
              "name": "user",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "strkfarm_contracts::components::harvester::reward_shares::UserRewardsInfo"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "get_rewards_info",
          "inputs": [
            {
              "name": "index",
              "type": "core::integer::u32"
            }
          ],
          "outputs": [
            {
              "type": "strkfarm_contracts::components::harvester::reward_shares::RewardsInfo"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "get_total_rewards",
          "inputs": [],
          "outputs": [
            {
              "type": "core::integer::u32"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "get_total_unminted_shares",
          "inputs": [],
          "outputs": [
            {
              "type": "core::integer::u128"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "get_additional_shares",
          "inputs": [
            {
              "name": "user",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "(core::integer::u128, core::integer::u64, core::integer::u128)"
            }
          ],
          "state_mutability": "view"
        }
      ]
    },
    {
      "type": "struct",
      "name": "strkfarm_contracts::interfaces::IVesu::IStonDispatcher",
      "members": [
        {
          "name": "contract_address",
          "type": "core::starknet::contract_address::ContractAddress"
        }
      ]
    },
    {
      "type": "struct",
      "name": "strkfarm_contracts::components::vesu::vesuStruct",
      "members": [
        {
          "name": "singleton",
          "type": "strkfarm_contracts::interfaces::IVesu::IStonDispatcher"
        },
        {
          "name": "pool_id",
          "type": "core::felt252"
        },
        {
          "name": "debt",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "col",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "oracle",
          "type": "core::starknet::contract_address::ContractAddress"
        }
      ]
    },
    {
      "type": "constructor",
      "name": "constructor",
      "inputs": [
        {
          "name": "name",
          "type": "core::byte_array::ByteArray"
        },
        {
          "name": "symbol",
          "type": "core::byte_array::ByteArray"
        },
        {
          "name": "asset",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "access_control",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "allowed_pools",
          "type": "core::array::Array::<strkfarm_contracts::strategies::vesu_rebalance::interface::PoolProps>"
        },
        {
          "name": "settings",
          "type": "strkfarm_contracts::strategies::vesu_rebalance::interface::Settings"
        },
        {
          "name": "vesu_settings",
          "type": "strkfarm_contracts::components::vesu::vesuStruct"
        }
      ]
    },
    {
      "type": "event",
      "name": "openzeppelin_security::reentrancyguard::ReentrancyGuardComponent::Event",
      "kind": "enum",
      "variants": []
    },
    {
      "type": "event",
      "name": "strkfarm_contracts::components::erc4626::ERC4626Component::Deposit",
      "kind": "struct",
      "members": [
        {
          "name": "sender",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "owner",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "assets",
          "type": "core::integer::u256",
          "kind": "data"
        },
        {
          "name": "shares",
          "type": "core::integer::u256",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "strkfarm_contracts::components::erc4626::ERC4626Component::Withdraw",
      "kind": "struct",
      "members": [
        {
          "name": "sender",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "receiver",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "owner",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "assets",
          "type": "core::integer::u256",
          "kind": "data"
        },
        {
          "name": "shares",
          "type": "core::integer::u256",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "strkfarm_contracts::components::erc4626::ERC4626Component::Event",
      "kind": "enum",
      "variants": [
        {
          "name": "Deposit",
          "type": "strkfarm_contracts::components::erc4626::ERC4626Component::Deposit",
          "kind": "nested"
        },
        {
          "name": "Withdraw",
          "type": "strkfarm_contracts::components::erc4626::ERC4626Component::Withdraw",
          "kind": "nested"
        }
      ]
    },
    {
      "type": "event",
      "name": "strkfarm_contracts::components::harvester::reward_shares::RewardShareComponent::Rewards",
      "kind": "struct",
      "members": [
        {
          "name": "index",
          "type": "core::integer::u32",
          "kind": "data"
        },
        {
          "name": "info",
          "type": "strkfarm_contracts::components::harvester::reward_shares::RewardsInfo",
          "kind": "data"
        },
        {
          "name": "total_reward_shares",
          "type": "core::integer::u128",
          "kind": "data"
        },
        {
          "name": "timestamp",
          "type": "core::integer::u64",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "strkfarm_contracts::components::harvester::reward_shares::RewardShareComponent::UserRewards",
      "kind": "struct",
      "members": [
        {
          "name": "user",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "info",
          "type": "strkfarm_contracts::components::harvester::reward_shares::UserRewardsInfo",
          "kind": "data"
        },
        {
          "name": "total_reward_shares",
          "type": "core::integer::u128",
          "kind": "data"
        },
        {
          "name": "timestamp",
          "type": "core::integer::u64",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "strkfarm_contracts::components::harvester::reward_shares::RewardShareComponent::Event",
      "kind": "enum",
      "variants": [
        {
          "name": "Rewards",
          "type": "strkfarm_contracts::components::harvester::reward_shares::RewardShareComponent::Rewards",
          "kind": "nested"
        },
        {
          "name": "UserRewards",
          "type": "strkfarm_contracts::components::harvester::reward_shares::RewardShareComponent::UserRewards",
          "kind": "nested"
        }
      ]
    },
    {
      "type": "event",
      "name": "openzeppelin_token::erc20::erc20::ERC20Component::Transfer",
      "kind": "struct",
      "members": [
        {
          "name": "from",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "to",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "value",
          "type": "core::integer::u256",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "openzeppelin_token::erc20::erc20::ERC20Component::Approval",
      "kind": "struct",
      "members": [
        {
          "name": "owner",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "spender",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "value",
          "type": "core::integer::u256",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "openzeppelin_token::erc20::erc20::ERC20Component::Event",
      "kind": "enum",
      "variants": [
        {
          "name": "Transfer",
          "type": "openzeppelin_token::erc20::erc20::ERC20Component::Transfer",
          "kind": "nested"
        },
        {
          "name": "Approval",
          "type": "openzeppelin_token::erc20::erc20::ERC20Component::Approval",
          "kind": "nested"
        }
      ]
    },
    {
      "type": "event",
      "name": "openzeppelin_introspection::src5::SRC5Component::Event",
      "kind": "enum",
      "variants": []
    },
    {
      "type": "event",
      "name": "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Upgraded",
      "kind": "struct",
      "members": [
        {
          "name": "class_hash",
          "type": "core::starknet::class_hash::ClassHash",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Event",
      "kind": "enum",
      "variants": [
        {
          "name": "Upgraded",
          "type": "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Upgraded",
          "kind": "nested"
        }
      ]
    },
    {
      "type": "event",
      "name": "openzeppelin_security::pausable::PausableComponent::Paused",
      "kind": "struct",
      "members": [
        {
          "name": "account",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "openzeppelin_security::pausable::PausableComponent::Unpaused",
      "kind": "struct",
      "members": [
        {
          "name": "account",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "openzeppelin_security::pausable::PausableComponent::Event",
      "kind": "enum",
      "variants": [
        {
          "name": "Paused",
          "type": "openzeppelin_security::pausable::PausableComponent::Paused",
          "kind": "nested"
        },
        {
          "name": "Unpaused",
          "type": "openzeppelin_security::pausable::PausableComponent::Unpaused",
          "kind": "nested"
        }
      ]
    },
    {
      "type": "event",
      "name": "strkfarm_contracts::components::common::CommonComp::Event",
      "kind": "enum",
      "variants": []
    },
    {
      "type": "event",
      "name": "strkfarm_contracts::strategies::vesu_rebalance::vesu_rebalance::VesuRebalance::Rebalance",
      "kind": "struct",
      "members": [
        {
          "name": "yield_before",
          "type": "core::integer::u128",
          "kind": "data"
        },
        {
          "name": "yield_after",
          "type": "core::integer::u128",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "strkfarm_contracts::strategies::vesu_rebalance::vesu_rebalance::VesuRebalance::CollectFees",
      "kind": "struct",
      "members": [
        {
          "name": "fee_collected",
          "type": "core::integer::u128",
          "kind": "data"
        },
        {
          "name": "fee_collector",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "strkfarm_contracts::components::harvester::harvester_lib::HarvestEvent",
      "kind": "struct",
      "members": [
        {
          "name": "rewardToken",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "rewardAmount",
          "type": "core::integer::u256",
          "kind": "data"
        },
        {
          "name": "baseToken",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "baseAmount",
          "type": "core::integer::u256",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "strkfarm_contracts::strategies::vesu_rebalance::vesu_rebalance::VesuRebalance::Event",
      "kind": "enum",
      "variants": [
        {
          "name": "ReentrancyGuardEvent",
          "type": "openzeppelin_security::reentrancyguard::ReentrancyGuardComponent::Event",
          "kind": "flat"
        },
        {
          "name": "ERC4626Event",
          "type": "strkfarm_contracts::components::erc4626::ERC4626Component::Event",
          "kind": "flat"
        },
        {
          "name": "RewardShareEvent",
          "type": "strkfarm_contracts::components::harvester::reward_shares::RewardShareComponent::Event",
          "kind": "flat"
        },
        {
          "name": "ERC20Event",
          "type": "openzeppelin_token::erc20::erc20::ERC20Component::Event",
          "kind": "flat"
        },
        {
          "name": "SRC5Event",
          "type": "openzeppelin_introspection::src5::SRC5Component::Event",
          "kind": "flat"
        },
        {
          "name": "UpgradeableEvent",
          "type": "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Event",
          "kind": "flat"
        },
        {
          "name": "PausableEvent",
          "type": "openzeppelin_security::pausable::PausableComponent::Event",
          "kind": "flat"
        },
        {
          "name": "CommonCompEvent",
          "type": "strkfarm_contracts::components::common::CommonComp::Event",
          "kind": "flat"
        },
        {
          "name": "Rebalance",
          "type": "strkfarm_contracts::strategies::vesu_rebalance::vesu_rebalance::VesuRebalance::Rebalance",
          "kind": "nested"
        },
        {
          "name": "CollectFees",
          "type": "strkfarm_contracts::strategies::vesu_rebalance::vesu_rebalance::VesuRebalance::CollectFees",
          "kind": "nested"
        },
        {
          "name": "Harvest",
          "type": "strkfarm_contracts::components::harvester::harvester_lib::HarvestEvent",
          "kind": "nested"
        }
      ]
    }
  ]