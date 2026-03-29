const { useState, useEffect } = React;

function LoadingScreen({ onFinished }) {
  const [speed, setSpeed] = useState("calculating...");

  useEffect(() => {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    const type = connection ? connection.effectiveType : "4g";
    setSpeed(type);

    let loadTime = type === "4g" ? 400 : 1200;

    const timer = setTimeout(() => {
      onFinished();
    }, loadTime);

    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "#282b28",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      <style>
        {`
                #container {
                    display: flex; justify-content: center; align-items: center;
                    position: relative; width: 200px; height: 200px;
                }

                .ring-node {
                    width: 190px; height: 190px; border: 1px solid transparent;
                    border-radius: 50%; position: absolute;
                }

                /* Your specific Rotation Keyframes */
                @keyframes rotate1 { from { transform: rotateX(50deg) rotateZ(110deg); } to { transform: rotateX(50deg) rotateZ(470deg); } }
                @keyframes rotate2 { from { transform: rotateX(20deg) rotateY(50deg) rotateZ(20deg); } to { transform: rotateX(20deg) rotateY(50deg) rotateZ(380deg); } }
                @keyframes rotate3 { from { transform: rotateX(40deg) rotateY(130deg) rotateZ(450deg); } to { transform: rotateX(40deg) rotateY(130deg) rotateZ(90deg); } }
                @keyframes rotate4 { from { transform: rotateX(70deg) rotateZ(270deg); } to { transform: rotateX(70deg) rotateZ(630deg); } }

                /* Assigned 1 Color per Ring */
                .ring-node:nth-child(1) { 
                    border-bottom: 8px solid rgb(240, 42, 230); /* Pink */
                    animation: rotate1 1s linear infinite; 
                }
                .ring-node:nth-child(2) { 
                    border-bottom: 8px solid rgb(240, 19, 67); /* Red */
                    animation: rotate2 1s linear infinite; 
                }
                .ring-node:nth-child(3) { 
                    border-bottom: 8px solid rgb(3, 170, 170); /* Teal */
                    animation: rotate3 1s linear infinite; 
                }
                .ring-node:nth-child(4) { 
                    border-bottom: 8px solid rgb(207, 135, 1); /* Gold */
                    animation: rotate4 1s linear infinite; 
                }

                #vessel-label {
                    color: #fff; font-family: monospace; font-weight: bold;
                    text-shadow: 0 0 10px rgba(255,255,255,0.5);
                    z-index: 10;
                }
                `}
      </style>

      <div id="container">
        <div className="ring-node" />
        <div className="ring-node" />
        <div className="ring-node" />
        <div className="ring-node" />
        <div id="vessel-label"></div>
      </div>
    </div>
  );
}
