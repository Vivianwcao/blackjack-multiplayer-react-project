import React from "react";
import styled from "styled-components";

export const FooterContainer = styled.div`
	// background: rgba(172,176,153,.6);
	padding: 20px;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 100%;
`;

export const FooterLogos = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	width: 130px;
	height: 50px;
	z-index: 1;
`;

export const Logo = styled.img`
	width: 26px;
`;
export const Footertext = styled.p`
	font-size: 12px;
	color: white;
	text-align: center;
`;
