import { useEffect } from "react";
import { useAuth } from "../../Firebase/FirebaseAuthentification/AuthProvider";
import { handleSignOut } from "../../Firebase/FirebaseAuthentification/signInPartners/googleSignIn";
import Popup from "../Popup/Popup";
import { AuthDetail } from "../Popup/AuthDetail";
import useToggle from "../../utils/hooks/useToggle";
import ProfilePhoto from "../ProfilePhoto/ProfilePhoto";
import "../../pages/style.scss";
import "./Banner.scss";
import { FaSignOutAlt } from "react-icons/fa";

const Banner = () => {
	const { user, users } = useAuth();
	const me = users?.find((u) => u.id === user?.uid);
	const [popAuthState, popAuthOpen, popAuthClose] = useToggle(false);
	useEffect(() => {
		if (!user) {
			popAuthClose();
			return;
		}
	}, [user]);
	return (
		<div className="banner">
			{user ? (
				<div className="banner__content-wrapper">
					<div className="banner__profile-wrapper">
						<h1>Welcome {user?.displayName}!</h1>
						<ProfilePhoto src={me?.photo} />
					</div>
					<p>
						Last login at:
						{` ${new Date(+user.metadata.lastLoginAt).toLocaleString()}`}
					</p>

					<div className="btn-wrapper">
						<button className="btn btn--sign-out" onClick={handleSignOut}>
							Sign out
							<FaSignOutAlt />
						</button>
					</div>
				</div>
			) : (
				<div className="btn-wrapper">
					<Popup name="auth" isOpen={popAuthState} onClose={popAuthClose}>
						<AuthDetail></AuthDetail>
					</Popup>

					<button className="btn btn--sign-in" onClick={popAuthOpen}>
						Sign in
					</button>
				</div>
			)}
		</div>
	);
};

export default Banner;
