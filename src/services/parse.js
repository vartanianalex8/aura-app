import Parse from 'parse';
import { PARSE_CONFIG } from '../constants/config';

Parse.initialize(PARSE_CONFIG.APP_ID, PARSE_CONFIG.JS_KEY);
Parse.serverURL = PARSE_CONFIG.SERVER_URL;

export default Parse;
