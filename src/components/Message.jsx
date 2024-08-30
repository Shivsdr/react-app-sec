import React, { useContext, useEffect, useRef, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import { ChatContext } from '../context/ChatContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
const CryptoJS = require("crypto-js");

const Message = ({message}) => {
  const {currentUser} = useContext(AuthContext);
  const {data} = useContext(ChatContext);
  const combinedId = currentUser.uid > data.user.uid ? currentUser.uid + data.user.uid: data.user.uid + currentUser.uid ;
  const [decryptedMessage, setDecryptedMessage] = useState("");

  useEffect(() => {
    const decrypt = async(text)=>{
      const docRef = doc(db, "userChats", currentUser.uid);
      const docSnap = await getDoc(docRef);
      let sessionKey;
      if (docSnap.exists()) {
        const data = docSnap.data();
        sessionKey = data[combinedId]['userInfo']['sessionKey'];
        console.log("Document data:", sessionKey);
      } else {
        console.log("No such document!");
      }
      console.log("text",text);
      let bytes  = CryptoJS.AES.decrypt(text, sessionKey);
      let originalText = bytes.toString(CryptoJS.enc.Utf8);
      console.log("ogText",originalText)
      setDecryptedMessage(originalText);
    }

    if (message.text1) {
      decrypt(message.text1);
    }
  }, [message.text1]);

  const ref = useRef()
  useEffect(()=>{
    ref.current?.scrollIntoView({behaviour:"smooth"})
  },[message]);

  return (
    <div ref={ref} className={`message ${message.senderId === currentUser.uid  && "owner"}`}>
      <div className="messageInfo">
        <img src={message.senderId === currentUser.uid ? currentUser.photoURL:data.user.photoURL} alt="" />
        <span>just now</span>
      </div>
      <div className="messageContent">
        {decryptedMessage && <p>{decryptedMessage}</p>}
        {message.img && <img src={message.img} alt="" />}
      </div>
    </div>
  )
}

export default Message
