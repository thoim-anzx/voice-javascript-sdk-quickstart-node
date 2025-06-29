require('dotenv').config();
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const AccessToken = require('twilio').jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
const ChatGrant = AccessToken.ChatGrant;

const nameGenerator = require('../name_generator');
const config = require('../config');

var identity;

exports.tokenGenerator = function tokenGenerator() {
  // Override
  return {
    identity: process.env.TWILIO_IDENTITY,
    token: process.env.TWILIO_ACCESS_TOKEN
  };

  identity = nameGenerator();

  const accessToken = new AccessToken(
      config.accountSid,
      config.apiKey,
      config.apiSecret,
      {
        identity: identity,
        ttl: 21600,
      }
  );
  const grant = new VoiceGrant({
    outgoingApplicationSid: config.twimlAppSid,
    incomingAllow: true,
  });
  accessToken.addGrant(grant);

  console.log('access request:', accessToken);
  // console.log('token', accessToken.toJwt());

  console.log(accessToken.toJwt());
  // Include identity and token in a JSON response
  return {
    identity: identity,
    token: accessToken.toJwt(),
  };
};

exports.voiceResponse = function voiceResponse(requestBody) {
  const toNumberOrClientName = requestBody.To;
  const callerId = config.callerId;
  const twiml = new VoiceResponse();

  console.log('VoiceResponse()');

  // If the request to the /voice endpoint is TO your Twilio Number,
  // then it is an incoming call towards your Twilio.Device.
  if (toNumberOrClientName == callerId) {
    const dial = twiml.dial();

    // This will connect the caller with your Twilio.Device/client
    dial.client(identity);
  } else if (requestBody.To) {
    // This is an outgoing call

    // set the callerId
    const dial = twiml.dial({callerId});

    // Check if the 'To' parameter is a Phone Number or Client Name
    // in order to use the appropriate TwiML noun
    const attr = isAValidPhoneNumber(toNumberOrClientName) ?
      'number' :
      'client';
    dial[attr]({}, toNumberOrClientName);
    // } else if (!requestBody.To) {
    //   const dial = twiml.dial();
    //   const application = dial.application();
    //   application.applicationSid(config.twimlAppSid);

    //   application.parameter({
    //     name: 'AccountNumber',
    //     value: '12345',
    //   });
    //   application.parameter({
    //     name: 'TicketNumber',
    //     value: '9876',
    //   });
  } else {
    twiml.say('Thanks for calling!');
  }

  console.log(twiml.toString());

  return twiml.toString();
};

/**
 * Checks if the given value is valid as phone number
 * @param {Number|String} number
 * @return {Boolean}
 */
function isAValidPhoneNumber(number) {
  return /^[\d\+\-\(\) ]+$/.test(number);
}
