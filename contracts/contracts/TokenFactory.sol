// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IUniswapV2Factory} from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import {IUniswapV2Router01} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { OApp, MessagingFee, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";

import {BondingCurve} from "./BondingCurve.sol";
import {Token} from "./Token.sol";

contract TokenFactory is ReentrancyGuard, Ownable, OApp {
    enum TokenState {
        NOT_CREATED,
        FUNDING,
        TRADING,
        BRIDGE
    }
    // uint256 public constant MAX_SUPPLY = 10 ** 9 * 1 ether; // 1 Billion
    // uint256 public constant INITIAL_SUPPLY = (MAX_SUPPLY * 1) / 5;
    // uint256 public constant FUNDING_SUPPLY = (MAX_SUPPLY * 4) / 5;
    // uint256 public constant FUNDING_GOAL = 500000000000000000;
    uint256 public constant FEE_DENOMINATOR = 10000;

    mapping(address => TokenState) public tokens;
    mapping(address => uint256) public collateral;
    address public immutable tokenImplementation;
    address public uniswapV2Router;
    address public uniswapV2Factory;
    BondingCurve public bondingCurve;
    uint256 public feePercent; // bp
    uint256 public fee;
    uint32[] public dstEidArray;

    uint public index;

    struct TokenDetails {
        address srcTokenAddress;
        address dstTokenAddress;
        address deployerAddress;
        uint MAX_SUPPLY;
        uint INITIAL_SUPPLY;
        uint FUNDING_SUPPLY;
        uint FUNDING_GOAL;
        uint index;
    }

    mapping(uint => TokenDetails) public tokenDetails;
    mapping(address => uint) public tokenAddressToIndex;

    // Events
    event TokenCreated(address indexed token, uint256 timestamp, address deployerAddress, uint index);
    event TokenLiqudityAdded(address indexed token, uint256 timestamp);
    event FactoryTokenIndex(uint indexed index, TokenDetails tokenDetails);
    event BuyToken(address indexed userAddress, uint amountInvested,uint amountMinted,uint fee,uint contributionWithoutFee);

    constructor(
        address _tokenImplementation,
        address _uniswapV2Router,
        address _uniswapV2Factory,
        address _bondingCurve,
        uint256 _feePercent,
        address _endpoint
    ) Ownable(msg.sender) OApp(_endpoint,msg.sender){
        tokenImplementation = _tokenImplementation;
        uniswapV2Router = _uniswapV2Router;
        uniswapV2Factory = _uniswapV2Factory;
        bondingCurve = BondingCurve(_bondingCurve);
        feePercent = _feePercent;
        index =0;
    }

    // Admin functions

    function setBondingCurve(address _bondingCurve) external onlyOwner {
        bondingCurve = BondingCurve(_bondingCurve);
    }

    function setFeePercent(uint256 _feePercent) external onlyOwner {
        feePercent = _feePercent;
    }

    function claimFee() external onlyOwner {
        (bool success, ) = msg.sender.call{value: fee}(new bytes(0));
        require(success, "ETH send failed");
        fee = 0;
    }

    // Token functions

    function createToken(
        string memory name,
        string memory symbol,
        uint maxSupply,
        uint fundingGoal,
        bytes calldata _options,
        uint amount,
        uint lz_fee,
        uint32 _dstEid,
        address _user
    ) external payable returns (address) {
       
        address tokenAddress = _createToken(name, symbol);


        emit TokenCreated(tokenAddress, block.timestamp,_user,index);
        tokens[tokenAddress] = TokenState.FUNDING;
        tokenDetails[index].srcTokenAddress = tokenAddress;
        tokenDetails[index].dstTokenAddress = address(0);
        tokenDetails[index].deployerAddress = _user;
        tokenDetails[index].MAX_SUPPLY = maxSupply;
        tokenDetails[index].INITIAL_SUPPLY = (maxSupply * 1)/5;
        tokenDetails[index].FUNDING_SUPPLY = (maxSupply * 4)/5;
        tokenDetails[index].FUNDING_GOAL = fundingGoal;

        tokenAddressToIndex[tokenAddress] = index;
        index++;

        if(amount != 0){
           _buy(_user,tokenAddress,amount);
        }

        for(uint i =0;i<dstEidArray.length;i++){
            bytes memory _functionCalldata = abi.encode(name,symbol,tokenAddress);
            bytes memory _payload = abi.encode(_user,1,_functionCalldata);
            sendLzMessage(dstEidArray[i],_options,_payload,_user,lz_fee);
        }

        
        emit FactoryTokenIndex(index,tokenDetails[index]);

        return tokenAddress;
    }

    function buy(address tokenAddress, uint valueToBuy) public payable nonReentrant {
        require(tokens[tokenAddress] == TokenState.FUNDING, "Token not found");
        require(valueToBuy > 0, "ETH not enough");
        require(valueToBuy == msg.value, "Not valid amount");
        // calculate fee
        // uint256 valueToBuy = msg.value;
        _buy(msg.sender,tokenAddress, valueToBuy);
    }

    function _buy(address user,address tokenAddress, uint valueToBuy) internal {
        uint256 valueToReturn;
        uint256 tokenCollateral = collateral[tokenAddress];
        uint _index = tokenAddressToIndex[tokenAddress];

        uint256 remainingEthNeeded = tokenDetails[_index].FUNDING_GOAL - tokenCollateral;
        uint256 contributionWithoutFee = valueToBuy * FEE_DENOMINATOR / (FEE_DENOMINATOR + feePercent);
        if (contributionWithoutFee > remainingEthNeeded) {
            contributionWithoutFee = remainingEthNeeded;
        }
        uint256 _fee = calculateFee(contributionWithoutFee, feePercent);
        uint256 totalCharged = contributionWithoutFee + _fee;
        valueToReturn = valueToBuy > totalCharged ? valueToBuy - totalCharged : 0;
        fee += _fee;
        Token token = Token(tokenAddress);
        uint256 amount = bondingCurve.getAmountOut(
            token.totalSupply(),
            contributionWithoutFee
        );
        uint256 availableSupply = tokenDetails[_index].FUNDING_SUPPLY - token.totalSupply();
        require(amount <= availableSupply, "Token supply not enough");
        tokenCollateral += contributionWithoutFee;
        token.mint(user, amount);

        emit BuyToken(user,valueToBuy,amount,_fee,contributionWithoutFee);
        if (tokenCollateral >= tokenDetails[_index].FUNDING_GOAL) {
          _addLiquidity(tokenAddress,tokenDetails[_index].INITIAL_SUPPLY,tokenCollateral);
        }
        collateral[tokenAddress] = tokenCollateral;
        // return left
        // if (valueToReturn > 0) {
        //     (bool success, ) = payable(user).call{value: msg.value - valueToBuy}(
        //         new bytes(0)
        //     );
        //     // require(success, "ETH send failed");
        // }
    }

    function _addLiquidity(address tokenAddress, uint _INITIAL_SUPPLY, uint tokenCollateral) internal {
        Token token = Token(tokenAddress);
        token.mint(address(this), _INITIAL_SUPPLY);
        address pair = createLiquilityPool(tokenAddress);
        uint256 liquidity = addLiquidity(
            tokenAddress,
            _INITIAL_SUPPLY,
            tokenCollateral
        );
        burnLiquidityToken(pair, liquidity);
        tokenCollateral = 0;
        tokens[tokenAddress] = TokenState.TRADING;
        emit TokenLiqudityAdded(tokenAddress, block.timestamp);
    }

    function sell(address tokenAddress, uint256 amount) external nonReentrant {
        require(
            tokens[tokenAddress] == TokenState.FUNDING,
            "Token is not funding"
        );
        require(amount > 0, "Amount should be greater than zero");
        Token token = Token(tokenAddress);
        uint256 receivedETH = bondingCurve.getFundsReceived(
            token.totalSupply(),
            amount
        );
        // calculate fee
        uint256 _fee = calculateFee(receivedETH, feePercent);
        receivedETH -= _fee;
        fee += _fee;
        token.burn(msg.sender, amount);
        collateral[tokenAddress] -= receivedETH;
        // send ether
        //slither-disable-next-line arbitrary-send-eth
        (bool success, ) = msg.sender.call{value: receivedETH}(new bytes(0));
        require(success, "ETH send failed");
    }

    // Internal functions

    function createLiquilityPool(
        address tokenAddress
    ) internal returns (address) {
        IUniswapV2Factory factory = IUniswapV2Factory(uniswapV2Factory);
        IUniswapV2Router01 router = IUniswapV2Router01(uniswapV2Router);

        address pair = factory.createPair(tokenAddress, router.WETH());
        return pair;
    }

    function addLiquidity(
        address tokenAddress,
        uint256 tokenAmount,
        uint256 ethAmount
    ) internal returns (uint256) {
        Token token = Token(tokenAddress);
        IUniswapV2Router01 router = IUniswapV2Router01(uniswapV2Router);
        token.approve(uniswapV2Router, tokenAmount);
        //slither-disable-next-line arbitrary-send-eth
        (, , uint256 liquidity) = router.addLiquidityETH{value: ethAmount}(
            tokenAddress,
            tokenAmount,
            tokenAmount,
            ethAmount,
            address(this),
            block.timestamp
        );
        return liquidity;
    }

    function burnLiquidityToken(address pair, uint256 liquidity) internal {
        SafeERC20.safeTransfer(IERC20(pair), address(0), liquidity);
    }

    function calculateFee(
        uint256 _amount,
        uint256 _feePercent
    ) internal pure returns (uint256) {
        return (_amount * _feePercent) / FEE_DENOMINATOR;
    }

    function _createToken(string memory name,string memory symbol) internal returns (address){
        address tokenAddress = Clones.clone(tokenImplementation);
        Token token = Token(tokenAddress);
        token.initialize(name, symbol);

        return tokenAddress;
    }

    function bridgeToken(address tokenAddress, uint256 amount, uint32 _dstEid,bytes calldata _options) public payable {
        Token token = Token(tokenAddress);
        token.burn(msg.sender,amount);

        uint _index = tokenAddressToIndex[tokenAddress];

        require(tokenDetails[_index].dstTokenAddress != address(0),"DST TOKEN NOT SET");
        bytes memory _bridge = abi.encode(tokenDetails[_index].dstTokenAddress,amount);
        bytes memory _payload = abi.encode(msg.sender,2,_bridge);
        sendLzMessage(_dstEid,_options,_payload,msg.sender,msg.value);
    }

    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata payload,
        address,  // Executor address as specified by the OApp.
        bytes calldata  // Any extra data or options to trigger on receipt.
    ) internal override {
        // Decode the payload to get the message
        // In this case, type is string, but depends on your encoding!
        (address user, uint functionType, bytes memory functionCalldata) = abi.decode(payload, (address,uint,bytes));

        if(functionType == 1){
            (string memory name, string memory symbol, address destinationAddress) = abi.decode(functionCalldata,(string,string,address));
            address tokenAddress = _createToken(name, symbol);
            emit TokenCreated(tokenAddress, block.timestamp,user,index);
            tokens[tokenAddress] = TokenState.BRIDGE;
            tokenDetails[index].srcTokenAddress = tokenAddress;
            tokenDetails[index].dstTokenAddress = destinationAddress;
            tokenDetails[index].deployerAddress = msg.sender;
            tokenAddressToIndex[tokenAddress] = index;
            index++;
        }

        if(functionType == 2){
            (address tokenAddress, uint amount) = abi.decode(functionCalldata,(address,uint));
            Token token = Token(tokenAddress);
            token.mint(user,amount);
        }
       
    }

    function addDstTokenAddress(uint _index, address dstToken) public onlyOwner{
        // require(tokenDetails[_index].deployerAddress == msg.sender, "Invalid deployer caller");
        
        tokenDetails[_index].dstTokenAddress = dstToken;
    }

    function quote(
        uint32 _dstEid,
        address tokenAddress, 
        uint256 amount, 
        bytes memory _options,
        bool _payInLzToken
    ) public view returns (MessagingFee memory _fee) {
        uint _index = tokenAddressToIndex[tokenAddress];
        bytes memory _payload = abi.encode(msg.sender,tokenDetails[_index].dstTokenAddress,amount);
        _fee = _quote(_dstEid, _payload, _options, _payInLzToken);
    }

    function setPeerAddress(
        uint32 _dstEid,
        address dstFactoryAddress
    ) external onlyOwner{
        bytes32 dstAddress = bytes32(abi.encode(dstFactoryAddress));
        dstEidArray.push(_dstEid);
        setPeer(_dstEid,dstAddress);
    } 

    function sendLzMessage(
        uint32 _dstEid,
        bytes calldata _options,
        bytes memory _payload,
        address sender,
        uint value
    ) internal {
         _lzSend(
            _dstEid,
            _payload,
            _options,
            // Fee in native gas and ZRO token.
            MessagingFee(value, 0),
            // Refund address in case of failed source message.
            payable(sender)
        );
    }

    function changeTokenState(uint newState, address tokenAddress) public onlyOwner {
        if(newState == 0) {
            tokens[tokenAddress] = TokenState.NOT_CREATED;
        }else if(newState == 1) {
            tokens[tokenAddress] = TokenState.FUNDING;
        }else if(newState == 2) {
            tokens[tokenAddress] = TokenState.TRADING;
        }else if(newState == 3) {
            tokens[tokenAddress] = TokenState.BRIDGE;
        }
    }

    function _payNative(uint256 _nativeFee) internal override pure returns(uint256 nativeFee){
        require(_nativeFee != 0, "Fee is 0");
        return _nativeFee;
    }

    fallback() external payable { }
    receive() external payable { }
}
