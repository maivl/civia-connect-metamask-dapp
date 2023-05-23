import { useEffect, useState, ChangeEvent, useRef } from "react";
import type { NextPage } from "next";
import { Button, Input, message, Steps, Spin, Form } from 'antd';
import { useContractRead, useContractWrite, useConnect, useAccount, useSignMessage } from 'wagmi';
import { getContract, getWalletClient, readContract, writeContract } from '@wagmi/core'

import CiviaERC20Check from '../../../abi/CiviaERC20Check.json';
import TestToken from '../../../abi/TestToken.json';

import styles from "./index.module.css"

const CIVIA_ERC20_CONTRACT_ADDRESS = '0x7fd4c5dE475801D4691Bd325Bf5937b430c516E4';


const Erc20Create: NextPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const { connect: metaMaskConnect, connectors: metaMaskConnectors, error: ucError, isLoading: ucIsLoading, pendingConnector } = useConnect();
  const { isConnected: isMetaMaskConnected, address: metamaskAddress } = useAccount();
  const connectMetamaskRef = useRef(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [grantedTokens, setGrantedTokens] = useState([]);
  //
  const [testTokenAddress, setTestTokenAddress] = useState('');

  useEffect(() => {
    if(metamaskAddress){
      setStep(1);
    }
  }, [metamaskAddress]);

  // registe contract
  const { data, error, isLoading: isWriting, isSuccess, write, writeAsync } = useContractWrite({
    address: CIVIA_ERC20_CONTRACT_ADDRESS,
    abi: CiviaERC20Check.abi,
    functionName: 'registERC20'
  });

  useEffect(() => {
    if(metamaskAddress){
      setIsLoading(true);
      readContract({
        address: CIVIA_ERC20_CONTRACT_ADDRESS,
        abi: CiviaERC20Check.abi,
        functionName: 'getUserRegistERC20Ids',
        args: [metamaskAddress]
      }).then((res) => {
        return readContract({
          address: CIVIA_ERC20_CONTRACT_ADDRESS,
          abi: CiviaERC20Check.abi,
          functionName: 'getERC20TokenAddrByIds',
          args: [res]
        });
      }).then((res) => {
        setGrantedTokens(res as []);
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [metamaskAddress]);

  useEffect(() => {
    if(testTokenAddress && grantedTokens.length){
      const isTestTokenGranted = grantedTokens.some((add: string) => add === testTokenAddress);
      isTestTokenGranted && setStep(3);
    }
  }, [grantedTokens, testTokenAddress]);

  // auto connect metamask
  if(!connectMetamaskRef.current && !metamaskAddress && metaMaskConnectors && metaMaskConnectors.length){
    connectMetamaskRef.current = true;
    metaMaskConnect({ connector: metaMaskConnectors[0] });
  }

  // step 1
  const registCiviaErc20 = async () => {
    if(!testTokenAddress){
      messageApi.open({
        type: 'error',
        content: 'Please specify token contract address',
      });
    }else{
      setIsLoading(true);
      const res = await writeAsync({ args: [testTokenAddress]}).then((res) => {
        setStep(2);
        return res;
      }).catch((err) => {
        console.log(err);
        const errorStr = String(err);
        const isExists = errorStr.includes('token already exists');
        messageApi.open({
          type: 'error',
          content: isExists ? 'token already exists': String(err),
        });
        isExists && setTimeout(() => {
          setStep(2)
        }, 1000);
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }

  // step 2
  const grantRole = async () => {
      //
      setIsLoading(true);
      const roleRes = await readContract({
        address: testTokenAddress  as `0x${string}`,
        abi: TestToken.abi,
        functionName: 'MINTER_ROLE'
      }).catch((err) => {
        messageApi.open({
          type: 'error',
          content: String(err),
        });
      });
      if(!roleRes){
        return setIsLoading(false);
      }
      const grantRes = await writeContract({
        address: testTokenAddress  as `0x${string}`,
        abi: TestToken.abi,
        functionName: 'grantRole',
        args: [roleRes, CIVIA_ERC20_CONTRACT_ADDRESS]
      }).catch((err) => {
        messageApi.open({
          type: 'error',
          content: String(err),
        });
      });
      setIsLoading(false);
      console.log(grantRes);
      if(grantRes && grantRes.hash){
        messageApi.open({
          type: 'success',
          content: grantRes.hash,
        });
        setStep(3);
      }else{
        messageApi.open({
          type: 'error',
          content: 'Authorize fail',
        });
      }
      
  }

    return (
      <div>
        <Spin spinning={isLoading}>
          {contextHolder}
              <div className={styles.body}>
                <div className={styles.steps}>
                  <Steps
                    size="small"
                    current={step}
                    items={[
                      {
                        title: 'Connect Wallet',
                      },
                      {
                        title: 'Input token contract address',
                      },
                      {
                        title: 'Authorize Civia to mint',
                      },{
                        title: 'Success',
                      },
                    ]}
                  />
                </div>
                <div className={styles.form}>
                  <Form
                    name="basic"
                    layout="vertical"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    style={{ maxWidth: 600 }}
                    autoComplete="off"
                  >
                  {
                    step === 1 ? (
                      <>
                        <Form.Item
                        label="Token contract address"
                        name="tokenAddress"
                        rules={[{ required: true, message: 'Please input token contract address!' }]}
                      >
                        <Input value={testTokenAddress} onChange={(event: ChangeEvent<HTMLInputElement>) => {setTestTokenAddress(event.target.value); }} maxLength={44} />
                      </Form.Item>
                      <Form.Item>
                        <div className={styles.btnWrapper}>
                          <Button onClick={registCiviaErc20} disabled={testTokenAddress.length<42} type="primary">Register</Button>
                        </div>
                      </Form.Item>
                      </>
                    ): null
                  }
                  {
                    step === 2? (
                      <>
                        <div className={styles.btnWrapper}>
                        <Button onClick={grantRole} type="primary">Authorize</Button>
                        </div>
                      </>
                    ): null
                  }
                 </Form>
                </div>
              </div>
        </Spin>
      </div>
    )
  }
  
  export default Erc20Create
  