import React, { useContext, useState } from 'react'
import Img from "../images/img.png"
import Attach from "../images/attach.png"
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import { Timestamp, arrayUnion, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import {v4 as uuid} from 'uuid';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import {  getDoc } from "firebase/firestore";
const CryptoJS = require("crypto-js");
// let mainsessionKey;
// function encryptText(textInput) {

//   let ciphertext = CryptoJS.AES.encrypt(textInput, mainsessionKey);
//   return ciphertext.toString();
// }

const Input = () => {
  const [text, setText] = useState("")
  const [img, setImg] = useState(null)
  const {currentUser} = useContext(AuthContext);
  const {data} = useContext(ChatContext);
  const combinedId = currentUser.uid > data.user.uid ? currentUser.uid + data.user.uid: data.user.uid + currentUser.uid ;
  // let mainsessionKey;

  // const handleEncryption = (inputText)=>{
  //   let ciphertext = CryptoJS.AES.encrypt(inputText, mainsessionKey);
  //   return ciphertext.toString();
  // }
  const handleKey = (e)=>{
    e.code === "Enter" && handleSend()
  };
  const handleSend = async()=>{
   
    
    const docRef = doc(db, "userChats", currentUser.uid);
    const docSnap = await getDoc(docRef);
    let sessionKey;
    if (docSnap.exists()) {
      const data = docSnap.data();
      sessionKey = data[combinedId]['userInfo']['sessionKey'];
      // mainsessionKey = sessionKey;
      console.log("Document data:", sessionKey);
    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
    }
    console.log("text=", typeof(text))
    let ciphertext = CryptoJS.AES.encrypt(text, sessionKey);
    console.log (ciphertext.toString());
    let text1 = ciphertext.toString();
    console.log("text1=",text1);
    // encryptText();
    if(img){
      const storageRef = ref(storage, uuid());
      const uploadTask = uploadBytesResumable(storageRef, img);

      uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
        switch (snapshot.state) {
          case 'paused':
            console.log('Upload is paused');
            break;
          case 'running':
            console.log('Upload is running');
            break;
        }
      }, 
        (error) => {
          // Handle unsuccessful uploads
          // setErr(true)
        }, 
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(async(downloadURL) => {
            console.log('File available at', downloadURL);//Extra
            await updateDoc(doc(db,"chats",data.chatId),{
              messages: arrayUnion({
                id:uuid(),
                text1,
                senderId:currentUser.uid,
                date:Timestamp.now(),
                img: downloadURL,
              }),
            });
          });
        }
      );
    }else{
      await updateDoc(doc(db,"chats",data.chatId),{
        messages: arrayUnion({
          id:uuid(),
          text1,
          senderId:currentUser.uid,
          date:Timestamp.now(),
        }),
      });
    }
    await updateDoc(doc(db,"userChats",currentUser.uid),{
      [data.chatId+".lastMessage"]:{
        text1
      },
      [data.chatId+".date"]: serverTimestamp(),
    });

    await updateDoc(doc(db,"userChats",data.user.uid),{
      [data.chatId+".lastMessage"]:{
        text1
      },
      [data.chatId+".date"]: serverTimestamp(),
    });
    setText("");
    setImg(null)

  }
  return (
    <div className='input'>
      <input type="text" placeholder='Enter Message...' onKeyDown={handleKey} onChange={e=>setText(e.target.value)} value={text} />
      <div className="send">
        <img src={Attach} alt="" />
        <input type="file" style={{display:'none'}}  id='file' onChange={e=>setImg(e.target.files[0])}/>
        <label htmlFor="file">
          <img src={Img} alt="" />
        </label>
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  )
}

export default Input