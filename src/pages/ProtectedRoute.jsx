import { useAuth } from "../Firebase/FirebaseAuthentification/AuthProvider";

//a page to route to the right content
const ProtectedRoute = ({ component: Component }) => {
	const user = useAuth();
	console.log("user from authProvider", user);

	if (user) return <Component />;
	else return <p>Please log in first.</p>;
};

export default ProtectedRoute;
