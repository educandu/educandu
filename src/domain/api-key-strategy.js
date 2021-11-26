import httpErrors from 'http-errors';
import passportStrategy from 'passport-strategy';

const { Unauthorized } = httpErrors;
const { Strategy } = passportStrategy;

export const API_KEY_HEADER = 'X-Api-Key';

export default class ApiKeyStrategy extends Strategy {
  constructor(verify) {
    super();
    this.name = 'apikey';
    this.verify = verify;
  }

  authenticate(req) {
    const apiKey = req.get(API_KEY_HEADER);
    if (!apiKey) {
      return this.pass();
    }

    const verifiedCallback = (err, user, info) => {
      return err || !user
        ? this.error(err || new Unauthorized())
        : this.success(user, info);
    };

    return this.verify(apiKey, verifiedCallback);
  }
}
