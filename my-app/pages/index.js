import { BigNumber, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { XyzTransition, XyzTransitionGroup } from '@animxyz/react'
import { addLiquidity, calculateCD } from "../utils/addLiquidity";
import {
  getCDTokensBalance,
  getEtherBalance,
  getLPTokensBalance,
  getReserveOfCDTokens,
} from "../utils/getAmounts";
import {
  getTokensAfterRemove,
  removeLiquidity,
} from "../utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";


import 'tailwindcss/tailwind.css';



export default function Home() {
  /** General state variables */
  // loading is set to true when the transaction is mining and set to false when
  // the transaction has mined
  const [loading, setLoading] = useState(false);
  // We have two tabs in this dapp, Liquidity Tab and Swap Tab. This variable
  // keeps track of which Tab the user is on. If it is set to true this means
  // that the user is on `liquidity` tab else he is on `swap` tab
  const [liquidityTab, setLiquidityTab] = useState(false);

  const [swapTab, setSwapTab] = useState(false);
  // This variable is the `0` number in form of a BigNumber
  const zero = BigNumber.from(0);
  /** Variables to keep track of amount */
  // `ethBalance` keeps track of the amount of Eth held by the user's account
  const [ethBalance, setEtherBalance] = useState(zero);
  // `reservedCD` keeps track of the Crypto Dev tokens Reserve balance in the Exchange contract
  const [reservedCD, setReservedCD] = useState(zero);
  // Keeps track of the ether balance in the contract
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero);
  // cdBalance is the amount of `CD` tokens help by the users account
  const [cdBalance, setCDBalance] = useState(zero);
  // `lpBalance` is the amount of LP tokens held by the users account
  const [lpBalance, setLPBalance] = useState(zero);
  /** Variables to keep track of liquidity to be added or removed */
  // addEther is the amount of Ether that the user wants to add to the liquidity
  const [addEther, setAddEther] = useState(zero);
  // addCDTokens keeps track of the amount of CD tokens that the user wants to add to the liquidity
  // in case when there is no initial liquidity and after liquidity gets added it keeps track of the
  // CD tokens that the user can add given a certain amount of ether
  const [addCDTokens, setAddCDTokens] = useState(zero);
  // removeEther is the amount of `Ether` that would be sent back to the user based on a certain number of `LP` tokens
  const [removeEther, setRemoveEther] = useState(zero);
  // removeCD is the amount of `Crypto Dev` tokens that would be sent back to the user based on a certain number of `LP` tokens
  // that he wants to withdraw
  const [removeCD, setRemoveCD] = useState(zero);
  // amount of LP tokens that the user wants to remove from liquidity
  const [removeLPTokens, setRemoveLPTokens] = useState("0");
  /** Variables to keep track of swap functionality */
  // Amount that the user wants to swap
  const [swapAmount, setSwapAmount] = useState("");
  // This keeps track of the number of tokens that the user would receive after a swap completes
  const [tokenToBeReceivedAfterSwap, settokenToBeReceivedAfterSwap] = useState(
    zero
  );
  // Keeps track of whether  `Eth` or `Crypto Dev` token is selected. If `Eth` is selected it means that the user
  // wants to swap some `Eth` for some `Crypto Dev` tokens and vice versa if `Eth` is not selected
  const [ethSelected, setEthSelected] = useState(true);
  /** Wallet connection */
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);

  // CATGIRL SHIT UWUWUWUWUUWUWUWUWUWUWU

    const [Menu, setMenu] = useState(false);
    const [message, setMessage] = useState(" \"Welcome to the Catgirl Cafe Dex! Please take a look at our menu to get started! ♡ \"")
    const [ShowDialogueButtons, setDialogueButtons] = useState(true);
    const [renderRemove, setRenderRemove] = useState(false);
    const [renderAdd, setRenderAdd] = useState(false);
    const [addRemoveMenu,setAddRemoveMenu] = useState(true);
    const [modalbg,setModalBg] = useState(false);
    const [modalbg2,setModalBg2] = useState(false);

  /**
   * getAmounts call various functions to retrive amounts for ethbalance,
   * LP tokens etc
   */
  const getAmounts = async () => {
    try {
      const provider = await getProviderOrSigner(false);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      // get the amount of eth in the user's account
      const _ethBalance = await getEtherBalance(provider, address);
      // get the amount of `Crypto Dev` tokens held by the user
      const _cdBalance = await getCDTokensBalance(provider, address);
      // get the amount of `Crypto Dev` LP tokens held by the user
      const _lpBalance = await getLPTokensBalance(provider, address);
      // gets the amount of `CD` tokens that are present in the reserve of the `Exchange contract`
      const _reservedCD = await getReserveOfCDTokens(provider);
      // Get the ether reserves in the contract
      const _ethBalanceContract = await getEtherBalance(provider, null, true);
      setEtherBalance(_ethBalance);
      setCDBalance(_cdBalance);
      setLPBalance(_lpBalance);
      setReservedCD(_reservedCD);
      setReservedCD(_reservedCD);
      setEtherBalanceContract(_ethBalanceContract);
    } catch (err) {
      console.error(err);
    }
  };

  /**** SWAP FUNCTIONS ****/

  /**
   * swapTokens: Swaps  `swapAmountWei` of Eth/Crypto Dev tokens with `tokenToBeReceivedAfterSwap` amount of Eth/Crypto Dev tokens.
   */
  const _swapTokens = async () => {
    try {
      // Convert the amount entered by the user to a BigNumber using the `parseEther` library from `ethers.js`
      const swapAmountWei = utils.parseEther(swapAmount);
      // Check if the user entered zero
      // We are here using the `eq` method from BigNumber class in `ethers.js`
      if (!swapAmountWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        // Call the swapTokens function from the `utils` folder
        await swapTokens(
          signer,
          swapAmountWei,
          tokenToBeReceivedAfterSwap,
          ethSelected
        );
        setLoading(false);
        // Get all the updated amounts after the swap
        await getAmounts();
        setSwapAmount("");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setSwapAmount("");
    }
  };

  /**
   * _getAmountOfTokensReceivedFromSwap:  Returns the number of Eth/Crypto Dev tokens that can be received
   * when the user swaps `_swapAmountWEI` amount of Eth/Crypto Dev tokens.
   */
  const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
    try {
      // Convert the amount entered by the user to a BigNumber using the `parseEther` library from `ethers.js`
      const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
      // Check if the user entered zero
      // We are here using the `eq` method from BigNumber class in `ethers.js`
      if (!_swapAmountWEI.eq(zero)) {
        const provider = await getProviderOrSigner();
        // Get the amount of ether in the contract
        const _ethBalance = await getEtherBalance(provider, null, true);
        // Call the `getAmountOfTokensReceivedFromSwap` from the utils folder
        const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
          _swapAmountWEI,
          provider,
          ethSelected,
          _ethBalance,
          reservedCD
        );
        settokenToBeReceivedAfterSwap(amountOfTokens);
      } else {
        settokenToBeReceivedAfterSwap(zero);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /*** END ***/

  /**** ADD LIQUIDITY FUNCTIONS ****/

  /**
   * _addLiquidity helps add liquidity to the exchange,
   * If the user is adding initial liquidity, user decides the ether and CD tokens he wants to add
   * to the exchange. If he is adding the liquidity after the initial liquidity has already been added
   * then we calculate the crypto dev tokens he can add, given the Eth he wants to add by keeping the ratios
   * constant
   */
  const _addLiquidity = async () => {
    try {
      // Convert the ether amount entered by the user to Bignumber
      const addEtherWei = utils.parseEther(addEther.toString());
      // Check if the values are zero
      if (!addCDTokens.eq(zero) && !addEtherWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        // call the addLiquidity function from the utils folder
        await addLiquidity(signer, addCDTokens, addEtherWei);
        setLoading(false);
        // Reinitialize the CD tokens
        setAddCDTokens(zero);
        // Get amounts for all values after the liquidity has been added
        await getAmounts();
      } else {
        setAddCDTokens(zero);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setAddCDTokens(zero);
    }
  };

  /**** END ****/

  /**** REMOVE LIQUIDITY FUNCTIONS ****/

  /**
   * _removeLiquidity: Removes the `removeLPTokensWei` amount of LP tokens from
   * liquidity and also the calculated amount of `ether` and `CD` tokens
   */
  const _removeLiquidity = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      // Convert the LP tokens entered by the user to a BigNumber
      const removeLPTokensWei = utils.parseEther(removeLPTokens);
      setLoading(true);
      // Call the removeLiquidity function from the `utils` folder
      await removeLiquidity(signer, removeLPTokensWei);
      setLoading(false);
      await getAmounts();
      setRemoveCD(zero);
      setRemoveEther(zero);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setRemoveCD(zero);
      setRemoveEther(zero);
    }
  };

  /**
   * _getTokensAfterRemove: Calculates the amount of `Ether` and `CD` tokens
   * that would be returned back to user after he removes `removeLPTokenWei` amount
   * of LP tokens from the contract
   */
  const _getTokensAfterRemove = async (_removeLPTokens) => {
    try {
      const provider = await getProviderOrSigner();
      // Convert the LP tokens entered by the user to a BigNumber
      const removeLPTokenWei = utils.parseEther(_removeLPTokens);
      // Get the Eth reserves within the exchange contract
      const _ethBalance = await getEtherBalance(provider, null, true);
      // get the crypto dev token reserves from the contract
      const cryptoDevTokenReserve = await getReserveOfCDTokens(provider);
      // call the getTokensAfterRemove from the utils folder
      const { _removeEther, _removeCD } = await getTokensAfterRemove(
        provider,
        removeLPTokenWei,
        _ethBalance,
        cryptoDevTokenReserve
      );
      setRemoveEther(_removeEther);
      setRemoveCD(_removeCD);
    } catch (err) {
      console.error(err);
    }
  };

  /**** END ****/

  /**
   * connectWallet: Connects the MetaMask wallet
   */
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or
   * without the signing capabilities of Metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading
   * transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction
   * needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being
   * sent. Metamask exposes a Signer API to allow your website to request
   * signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false
   * otherwise
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Goerli network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getAmounts();
    }
  }, [walletConnected]);

/*CATGIRL SHIT */
  const Background = () => {
    const [enterDex,setEnterDex] = useState(false);

    const checkIfConnected = async () => {
      if (walletConnected)
        setEnterDex(true);
      else {
        connectWallet();
        console.log(enterDex);
        console.log(walletConnected);
      }
    }

    const WelcomeScreen = () => {
      return(<div className={styles.welcomebg}>
        <br/>
        <br/>
        <br/>

<div >
<div className={styles.logo}/>
</div>

      <button className={styles.enterCafeButton}onClick={() => {
          checkIfConnected();
        }}>Enter</button>

      </div>)

    }

    const RenderDex = () => {
      return(
        !enterDex ? <div>{WelcomeScreen()}</div> : <>{SelectScreen()}</>
      )
    }

    return(
      <div className={styles.screen}>
        <div>
          {RenderDex()}
        </div>
      </div>
    )
  }

  const Dialogue = () => {
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }


    const DialogueButtons = () => {
      if(ShowDialogueButtons == true)return(    <button className={styles.dialogueButton} onClick={() => {
        OpenMenu();
      }}>Sure!</button>)
      else(<></>)
    }



    async function OpenMenu() {
      setMenu(true);
      setMessage(" \"Please make a selection !\" ")
      setDialogueButtons(false);
    }



    return(<><div className={styles.dialogue}> <div key={message} className={styles.type}>{message}</div>
  <br/>

      </div>
      {DialogueButtons()}
    </>)



  }
  const SelectScreen = () => {



    return(
    <div className={styles.screen}>
      {ModalBg()}
      {ModalBg2()}
      <div className={styles.catgirl1}/>
      <div className={styles.dialogueBox}>{Dialogue()}</div>
      <div className={styles.dialogueName}> Maid Neko chan</div>
      {RenderMenu()}
      {RenderSwap()}
      {RenderLiquidity()}
    </div>)
  }

  const RenderMenu = () => {
    
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function SwapClicked() {
      setMessage(" \"Excellent choice!\" ");
      setMenu(false);
      setSwapTab(true);
      await sleep('3000');
      setMessage("\"Swap tokens in our pools!\"");
      setModalBg2(true);
      
      
    }

    async function LiquidityClicked() {
      setLiquidityTab(true);
      setMenu(false);
      setMessage(" \"Excellent choice!\" ");
      await sleep('3000');
      setMessage( "\"Add to or remove liquidity from our pools!\" ");
      setModalBg(true);
    }

    console.log(Menu);
    if(Menu){
      return(<div className={styles.menu}>

<br/>
      <br/>
      <br/>
      <br/>
      <div onClick={() => {
        LiquidityClicked();
      }} className={styles.MenuItem}>Liquidity </div>
      <br/>
      <br/>
      <button onClick={() => {
        SwapClicked();
      }} className={styles.MenuItem}> {"Swap"} </button>
      <br/>
      <br/>
      
      <br/>

      </div>)
    }
  }

    const ModalBg = () => {
      if(modalbg == true)
      return(<div className={styles.modalbg}>
        <ul className={styles.circles}>
        <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    </ul>
      </div>)
    }

    const ModalBg2 = () => {
      if(modalbg2 == true) 
      return(<div className={styles.modalbg2}></div>)
    }

    const RenderSwap = () => {
      if(swapTab == true)
      return(<div className={styles.modal}>
        <div className={styles.x} onClick={() => {
        setSwapTab(false),setDialogueButtons(true),setMessage("\"Would you like anything else?\" ",setModalBg(false),setModalBg2(false));
      }} ></div>
        <div>
          
        
      <h1>Swap</h1>
      
    
      NEKO / ETH Pool 
      <br/>
      <br/>
      <div >
        <div className={styles.flex}>
        <div>
          <select
            className={styles.select}
            name="dropdown"
            id="dropdown"
            onChange={async () => {
              setEthSelected(!ethSelected);
              // Initialize the values back to zero
              await _getAmountOfTokensReceivedFromSwap(0);
              setSwapAmount("");
            }}
          > 
         
            <option value="eth">Ether</option>
            <option value="cryptoDevToken">NEKO</option>

          </select>
         
          <br/>
          <input
            type="number"
            placeholder="Amount"
            onChange={async (e) => {
              setSwapAmount(e.target.value || "");
              // Calculate the amount of tokens user would receive after the swap
              await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
            }}
            className={styles.input}
            value={swapAmount}
          />
          
        
          </div>
       
          <div className={styles.swapPic}></div>
          <div className={styles.inputDiv}>
            {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
            {ethSelected
              ? `You will get ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} NEKO`
              : `You will get ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} Eth`}

          </div>
          </div>
          </div>
        
          <br/>
          <button className={styles.button1} onClick={_swapTokens}>
            Swap
          </button>
        </div>

      </div>)
      else {
        return(<></>)
      }
    }
    

    const RenderLiquidity = () => {


      const AddOrRemove = () => {
        if(addRemoveMenu == true)
        return(
          <div className={styles.center}>
          <h1>Liquidity</h1>
          
          <div className={styles.button1} onClick={() => {
            setRenderAdd(true),setRenderRemove(false),setAddRemoveMenu(false);
          }}>Add</div>
          <br/>
          
          <div className={styles.button1} onClick={() => {
            setRenderRemove(true),setRenderAdd(false),setAddRemoveMenu(false);
          }}>Remove</div></div>
        )
        else
        return(<></>)
      }

      const Add = () => {
        if(renderAdd == true)
        return(
          <>
           
          <h1>Add Liquidity</h1>
          <div onClick={() => {
            setRenderAdd(false),setRenderRemove(false),setAddRemoveMenu(true);
          }}><u>← Back</u></div>
          <br/>
          <div className={styles.description}>
            You have:
            <br />
            {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
            {utils.formatEther(cdBalance)} NEKO
            <br />
            {utils.formatEther(ethBalance)} Ether
            <br />
            {utils.formatEther(lpBalance)} Kibble LP tokens
          </div>
          <div>
            {/* If reserved CD is zero, render the state for liquidity zero where we ask the user
            how much initial liquidity he wants to add else just render the state where liquidity is not zero and
            we calculate based on the `Eth` amount specified by the user how much `CD` tokens can be added */}
            {utils.parseEther(reservedCD.toString()).eq(zero) ? (
              <div>

                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={(e) => setAddEther(e.target.value || "0")}
                  className={styles.input}
                /> ETH
                <br/>
                <input
                  type="number"
                  placeholder="Amount of NEKO"
                  onChange={(e) =>
                    setAddCDTokens(
                      BigNumber.from(utils.parseEther(e.target.value || "0"))
                    )
                  }
                  className={styles.input}
                /> NEKO
                <br/>
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={async (e) => {
                    setAddEther(e.target.value || "0");
                    // calculate the number of CD tokens that
                    // can be added given  `e.target.value` amount of Eth
                    const _addCDTokens = await calculateCD(
                      e.target.value || "0",
                      etherBalanceContract,
                      reservedCD
                    );
                    setAddCDTokens(_addCDTokens);
                  }}
                  className={styles.input}
                />
                <div className={styles.inputDiv}>
                  {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                  {`You will need ${utils.formatEther(addCDTokens)} Crypto Dev
                  Tokens`}
                </div>
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            )}
       
          </div></>
        )
        else
        return(
          <></>
        )
      }
      
      const Remove = () => {
        if(renderRemove == true)
        return(
          <div>
            <h1>Remove Liquidity</h1>
            <div onClick={() => {
            setRenderAdd(false),setRenderRemove(false),setAddRemoveMenu(true);
          }}><u>← Back</u></div>
            <div onClick={() => {
            setRenderAdd(false),setRenderRemove(false),setAddRemoveMenu(true);
          }}></div>
            <br/>
            Amount of LP tokens to be redeemed
            <br/>
          <input
            type="number"
            placeholder="Fishies"
            onChange={async (e) => {
              setRemoveLPTokens(e.target.value || "0");
              // Calculate the amount of Ether and CD tokens that the user would receive
              // After he removes `e.target.value` amount of `LP` tokens
              await _getTokensAfterRemove(e.target.value || "0");
            }}
            className={styles.input}
          />
          <div className={styles.inputDiv}>
            {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
            {`You will get ${utils.formatEther(removeCD)} NEKO and ${utils.formatEther(removeEther)} Eth`}
          </div>
          <button className={styles.button1} onClick={_removeLiquidity}>
            Remove
          </button>
        </div>
        )
        else
        return (
        <></>
        )
      }

      if(liquidityTab == true)
      return(
        <div className={styles.modal}>
           <div onClick={() => {
        setLiquidityTab(false), setRenderAdd(false), setRenderRemove(false), setAddRemoveMenu(true),setDialogueButtons(true),setMessage("\"Would you like anything else?\""),setModalBg(false),setModalBg2(false);
      }}className={styles.x}/>

          <div>
            {AddOrRemove()}
            {Add()}
            {Remove()}
          
          </div>

          </div>
      )
      else{
        return(<></>)
      }
    }
  return (
    <div>
      <Head>
        <title>Catgirl Cafe DEX</title>
        <meta name="description" content="Catgirl Dex" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {Background()}
    </div>
  );
}

