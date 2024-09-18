import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import sha256 from 'sha256';
import User from '../models/Users.js';

const PHONEPE_URI = process.env.PHONEPE_URI || "https://api-preprod.phonepe.com/apis/pg-sandbox"
const MERCHANT_ID = process.env.MERCHANT_ID || "PGTESTPAYUAT86";
const SALT_KEY = process.env.SALT_KEY || "96434309-7796-489d-8924-ab56988a6076"
const SALT_INDEX = process.env.SALT_INDEX || 1;


const initiatePayment = asyncHandler(async (req, res) => {
  const { merchantUserId } = req.params;
  const merchantTransactionId = "T"+merchantUserId;

  const payload = {
    "merchantId": MERCHANT_ID,
    "merchantTransactionId": merchantTransactionId,
    "merchantUserId": merchantUserId,
    "amount": 19900,
    "redirectUrl": `http://localhost:3000/payment/redirect/${merchantTransactionId}`,
    "redirectMode": "REDIRECT",
    "callbackUrl": `http://localhost:5000/payment/callback/${merchantTransactionId}`,
    "paymentInstrument": {
      "type": "PAY_PAGE"
    }
  }

  // SHA256(Base64 encoded payload + “/pg/v1/pay” + salt key) + ### + salt index
  const bufferObj = Buffer.from(JSON.stringify(payload), "utf8")
  const payloadBase64 = bufferObj.toString("base64");
  const xVerify = sha256(payloadBase64 + "/pg/v1/pay" + SALT_KEY) + "###" + SALT_INDEX;

  const options = {
    method: 'post',
    url: `${PHONEPE_URI}/pg/v1/pay`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-VERIFY': xVerify,
    },
    data: {
      request: payloadBase64,
    }
  };
  axios.request(options)
    .then(function (response) {
      // res.status(201).json({ url: response.data.data.instrumentResponse.redirectInfo.url })
      res.redirect(response.data.data.instrumentResponse.redirectInfo.url)
    })
    .catch(function (error) {
      console.error(error);
    });
})


const paymentStatus = asyncHandler(async (req, res) => {
  const { merchantTransactionId } = req.params;

  if (merchantTransactionId) {
    // SHA256(“/pg/v1/status/{merchantId}/{merchantTransactionId}” + saltKey) + “###” + saltIndex
    const xVerify = sha256(`/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` + SALT_KEY) + "###" + SALT_INDEX;
    
    const options = {
      method: 'get',
      url: `${PHONEPE_URI}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-MERCHANT-ID': MERCHANT_ID,
        'X-VERIFY': xVerify
      },
    };

    try {
      const response = await axios.request(options);

      if (response.data.code === "PAYMENT_SUCCESS") {
        const userId = merchantTransactionId.slice(1);
        const user = await User.findById(userId).exec();
        if (user) {
          user.premium = true;
          await user.save();
          return res.status(200).send({ message: "Payment was successfully completed, user is now premium." });
        } else {
          return res.status(404).send({ message: "User not found." });
        }
      } else if (response.data.code === "PAYMENT_ERROR") {
        return res.status(422).send({ message: response.data.data.responseCodeDescription });
      } else {
        return res.status(400).send({ message: response.data.message });
      }

    } catch (error) {
      console.error("Error while checking payment status:", error);
      return res.status(500).send({ message: "Internal server error while checking payment status." });
    }
  } else {
    return res.status(400).send({ message: "Invalid merchant transaction ID" });
  }
});


const callback = asyncHandler(async(req, res) => {
  console.log('callback request received')
})
export {
  initiatePayment,
  paymentStatus,
  callback
};
