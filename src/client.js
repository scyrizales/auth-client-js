import request from 'superagent';
import promise from 'superagent-promise-plugin';
import SessionStore from './sessionStore';

function now() {
  return Math.floor((new Date()).getTime() / 1000);
}

export default class Client {
  static TOK = "tok";

  constructor(config, refresh_token) {
    this.config = config;
    this.store = new SessionStore(window.localStorage);
    this.tokens = this._setOrRestoreTokens(refresh_token);
  }

  _setOrRestoreTokens(refresh_token) {
    const storedTokens = this.store.getObject(Client.TOK);
    if (refresh_token)
        return {refresh_token};
    if (storedTokens)
        return {storedTokens};
    return {};
  }

  _tokens(tokens) {
    this.tokens = tokens;
    this.interval = this.tokens.expires_in;
    this.expires = now() + this.interval;
    this.store.setObject(Client.TOK, this.tokens);
    return this.tokens;
  }

  _clearTokens() {
    this.tokens = null;
    this.store.setObject(Client.TOK, null);
  }

  async login(username, password) {
    const response = await request
      .post(this.config.endpoint + '/login')
      .auth(username, password)
      .accept('application/json')
      .use(promise)
      .end();
    if (response.status == 200)
      return this._tokens(response.body);
    else
      throw response.error;
  }

  async refresh() {
    const {refresh_token} = this.tokens;
    if (!refresh_token)
      throw Error("no refresh token");
    const response = await request
      .post(this.config.endpoint + '/refresh')
      .type('application/json')
      .accept('application/json')
      .send({refresh_token})
      .use(promise)
      .end();
    if (response.status == 200)
      return this._tokens(response.body);
    else
      throw response.error;
  }

  async logout() {
    const {access_token} = this.tokens;
    if (!access_token)
      throw Error("no access token");
    else {
      const response = await request
        .post(this.config.endpoint + '/logout')
        .set('authorization', 'Bearer ' + access_token)
        .use(promise)
        .end();
      if (response.status == 204){
        this._clearTokens();
        return true;
    }
      else
        throw response.error;
    }
  }

  async reauthenticate() {
    if (this.tokens && this.expires && this.interval &&
        this.expires - now() > 0.5 * this.interval)
      return true;
    else
      return this.refresh();
  }
}
