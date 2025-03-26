import "./ProfilePhoto.scss";

const ProfilePhoto = ({ src }) => {
	const defaultImage = "/assets/profile.svg"; // Path to the default profile image

	return (
		<div className="profile-photo">
			<img src={src || defaultImage} alt="Profile" />
		</div>
	);
};
export default ProfilePhoto;
