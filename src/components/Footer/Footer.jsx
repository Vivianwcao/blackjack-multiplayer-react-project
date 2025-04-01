import React from "react";
import {
	FooterContainer,
	FooterLogos,
	Footertext,
	Logo,
} from "./FooterElements";
import githubLink from "../../logos/githubwhite.png";
import linkedinLink from "../../logos/linkedinhalowhite.png";
import emailLink from "../../logos/messagewhite.png";

const Footer = () => {
	return (
		<FooterContainer>
			<FooterLogos>
				<a href="https://github.com/Vivianwcao">
					<Logo src={githubLink} alt="Github button" />
				</a>
				<a href="https://www.linkedin.com/in/vivianwcao/">
					<Logo src={linkedinLink} alt="Linkedin button" />
				</a>
				<a href="mailto:vivian.w.cao@gmail.com">
					<Logo src={emailLink} alt="email button" />
				</a>
			</FooterLogos>
			<Footertext>
				&#10084; Vivian Cao &#128522; 2025
				<br></br>Icons made by Freepik from{" "}
				<a
					href="https://www.flaticon.com/authors/freepik"
					style={{ textDecoration: "none", color: "#fff" }}
				>
					flaticon
				</a>
			</Footertext>
		</FooterContainer>
	);
};

export default Footer;
