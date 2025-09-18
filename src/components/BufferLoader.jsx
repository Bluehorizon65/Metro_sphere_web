import React from "react";

const BufferLoader = () => (
	<div className="buffer-loader-overlay">
		<div className="buffer-loader-spinner">
			<svg width="60" height="60" viewBox="0 0 50 50">
				<circle
					cx="25"
					cy="25"
					r="20"
					fill="none"
					stroke="#007bff"
					strokeWidth="5"
					strokeLinecap="round"
					strokeDasharray="31.4 31.4"
				>
					<animateTransform
						attributeName="transform"
						type="rotate"
						from="0 25 25"
						to="360 25 25"
						dur="1s"
						repeatCount="indefinite"
					/>
				</circle>
			</svg>
			<span className="buffer-loader-text">Loading...</span>
		</div>
	</div>
);

export default BufferLoader;
