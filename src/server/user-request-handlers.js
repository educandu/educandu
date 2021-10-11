
import urls from '../utils/urls';
import requestHelper from '../utils/request-helper';
import { SAVE_USER_RESULT } from '../domain/user-management';

const handlePostUser = async ({ req, res, userService, clientDataMapper, mailService }) => {
  const { username, password, email } = req.body;

  if (email !== email.toLowerCase()) {
    res.status(400).send('The \'email\' field is expected to be in lower case.');
    return;
  }

  const { result, user } = await userService.createUser(username, password, email);

  if (result === SAVE_USER_RESULT.success) {
    const { origin } = requestHelper.getHostInfo(req);
    const verificationLink = urls.concatParts(origin, urls.getCompleteRegistrationUrl(user.verificationCode));
    await mailService.sendRegistrationVerificationLink(email, verificationLink);
  }

  res.send({ result, user: user ? clientDataMapper.dbUserToClientUser(user) : null });
};

export default {
  handlePostUser
};
