"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import * as THREE from "three";
import { useRouter } from "next/navigation";

// Particle component for the button
const ButtonParticles = () => {
  const particles = [];
  const colors = ["#FFD700", "#FFA500", "#FF8C00", "#FF4500"];
  
  // Create 20 particles with random properties
  for (let i = 0; i < 20; i++) {
    const size = Math.random() * 6 + 3;
    particles.push(
      <div
        key={i}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: colors[Math.floor(Math.random() * colors.length)],
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          opacity: 0,
          transform: 'scale(0)',
          animation: `particleFade ${Math.random() * 2 + 1}s ease-out infinite ${Math.random() * 2}s`
        }}
      />
    );
  }
  
  return <>{particles}</>;
};

export default function Home() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const titleRef = useRef(null);
  const storyRef = useRef(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 3D button hover effect
  const handleButtonMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ctaRef.current) return;
    
    const rect = ctaRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    gsap.to(ctaRef.current, {
      rotationY: x * 10,
      rotationX: -y * 10,
      transformPerspective: 500,
      duration: 0.4
    });
  };
  
  const handleButtonMouseLeave = () => {
    gsap.to(ctaRef.current, {
      rotationY: 0,
      rotationX: 0,
      duration: 0.7,
      ease: "elastic.out(1, 0.3)"
    });
  };

  // Hàm xử lý khi click nút Bắt Đầu
  const handleStartGame = () => {
    if (isTransitioning) return; // Tránh double-click
    setIsTransitioning(true);

    // Lưu trạng thái chuyển cảnh vào localStorage để trang stage1 có thể biết đang có transition
    localStorage.setItem('game_transition', 'true');
    localStorage.setItem('transition_time', Date.now().toString());

    // Tạo animation chuyển cảnh
    const tl = gsap.timeline({
      onComplete: () => {
        // Chuyển đến trang giai đoạn 1 sau khi animation hoàn tất
        router.push('/stages/stage1');
      }
    });

    // Hiệu ứng cho nút
    tl.to(ctaRef.current, {
      scale: 1.2,
      duration: 0.3,
      ease: "back.in(1.7)"
    })
    .to(ctaRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in"
    }, "+=0.1");

    // Hiệu ứng cho nội dung chính
    tl.to(storyRef.current, {
      opacity: 0,
      y: -30,
      duration: 0.4,
      ease: "power2.in"
    }, "-=0.4")
    .to(titleRef.current, {
      opacity: 0,
      y: -30,
      duration: 0.4,
      ease: "power2.in"
    }, "-=0.3");

    // Hiệu ứng màn hình chuyển cảnh từ giữa màn hình
    tl.fromTo(overlayRef.current,
      { 
        opacity: 0,
        scale: 0
      },
      { 
        opacity: 1,
        scale: 15,
        duration: 1.2,
        ease: "power2.in"
      }, 
      "-=0.3"
    );
  };

  useEffect(() => {
    // Add particle animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes particleFade {
        0% { opacity: 0; transform: scale(0) translate(0, 0); }
        20% { opacity: 0.8; transform: scale(1) translate(0, 0); }
        100% { opacity: 0; transform: scale(0.5) translate(${Math.random() > 0.5 ? '-' : ''}${Math.random() * 50}px, -${Math.random() * 50 + 20}px); }
      }
      
      @keyframes shinyEffect {
        0% { left: -100%; }
        100% { left: 200%; }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.7); }
        70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(255, 165, 0, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 165, 0, 0); }
      }
    `;
    document.head.appendChild(style);
    
    // Set particles to show after a delay
    setTimeout(() => setShowParticles(true), 1000);
    
    // GSAP animations
    const tl = gsap.timeline();
    
    tl.from(titleRef.current, {
      y: -100,
      opacity: 0,
      duration: 1.2,
      ease: "bounce.out"
    })
    .from(storyRef.current, {
      opacity: 0,
      duration: 1,
      y: 50,
      stagger: 0.2,
    }, "-=0.5")
    .from(ctaRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.8,
      ease: "back.out(1.7)"
    }, "-=0.3");
    
    // Simple pulsing animation for the button
    gsap.to(ctaRef.current, {
      scale: 1.05,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
    
    // Glow effect animation
    gsap.to(".btn-glow", {
      boxShadow: "0 0 15px 5px rgba(255, 165, 0, 0.7)",
      repeat: -1,
      yoyo: true,
      duration: 1.5,
      ease: "sine.inOut"
    });

    // Shine effect animation - removed transform to avoid conflicts
    gsap.to(".shine", {
      left: "100%",
      repeat: -1,
      duration: 3,
      ease: "power2.inOut",
      delay: 1,
      repeatDelay: 4
    });

    // Three.js ocean background
    if (canvasRef.current) {
      // Set up Three.js scene
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ 
        canvas: canvasRef.current,
        antialias: true,
        alpha: true 
      });
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      // Create ocean waves
      const geometry = new THREE.PlaneGeometry(20, 20, 50, 50);
      const material = new THREE.MeshStandardMaterial({
        color: '#0077be',
        wireframe: false,
        side: THREE.DoubleSide,
      });
      
      const ocean = new THREE.Mesh(geometry, material);
      ocean.rotation.x = -Math.PI / 2;
      scene.add(ocean);
      
      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      // Add directional light (sun-like)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 5);
      scene.add(directionalLight);
      
      // Thêm sấm sét
      const lightningMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xf0f0ff,
        emissive: 0xf0f0ff,
        emissiveIntensity: 2,
      });
      
      // Tạo hình dạng sấm sét nhưng chưa thêm vào scene
      const lightningGeometry = createLightningShape();
      const lightning = new THREE.Mesh(lightningGeometry, lightningMaterial);
      lightning.visible = false;
      scene.add(lightning);
      
      // Thêm ánh sáng cho sấm sét
      const lightningLight = new THREE.PointLight(0xf0f0ff, 100, 20);
      lightningLight.position.set(10, 5, 10);
      lightningLight.visible = false;
      scene.add(lightningLight);
      
      camera.position.set(0, 2, 5);
      
      // Hàm tạo sấm sét
      function createLightning() {
        if (Math.random() > 0.985) {
          // Vị trí ngẫu nhiên cho sấm sét
          const x = Math.random() * 20 - 10;
          const z = Math.random() * 20 - 10;
          
          // Xóa sấm sét cũ nếu có
          scene.remove(lightning);
          
          // Tạo hình dạng mới cho sấm sét
          const newLightningGeometry = createLightningShape();
          const newLightning = new THREE.Mesh(newLightningGeometry, lightningMaterial);
          
          // Đặt vị trí và thêm vào scene
          newLightning.position.set(x, 0, z);
          scene.add(newLightning);
          
          // Cập nhật reference
          lightning.geometry.dispose();
          lightning.geometry = newLightningGeometry;
          
          // Ánh sáng điểm theo sấm sét
          lightningLight.position.set(x, 5, z);
          lightningLight.visible = true;
          
          // Thêm tiếng sấm sét (nếu có thể)
          
          // Tắt sấm sét sau một khoảng thời gian ngắn
          setTimeout(() => {
            scene.remove(newLightning);
            lightningLight.visible = false;
          }, 100 + Math.random() * 150);
        }
      }
      
      // Animation function
      function animate() {
        requestAnimationFrame(animate);
        
        // Animate ocean waves
        const positions = ocean.geometry.attributes.position;
        const time = Date.now() * 0.002;
        
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          const y = positions.getY(i);
          
          // Create wave effect
          positions.setZ(i, Math.sin(x + time) * 0.2 + Math.cos(y + time) * 0.2);
        }
        
        positions.needsUpdate = true;
        
        // Tạo hiệu ứng sấm sét
        createLightning();
        
        renderer.render(scene, camera);
      }
      
      animate();
      
      // Handle window resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Create Pika robot character
      const createRobot = () => {
        const robotContainer = document.getElementById('robot-container');
        if (!robotContainer) return;
        
        // Create robot scene
        const robotScene = new THREE.Scene();
        const robotCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
        const robotRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        robotRenderer.setSize(200, 200);
        robotRenderer.setClearColor(0x000000, 0);
        robotContainer.appendChild(robotRenderer.domElement);
        
        // Robot body group
        const body = new THREE.Group();
        
        // Main body (egg-shaped)
        const bodyGeometry = new THREE.SphereGeometry(1, 32, 32);
        bodyGeometry.scale(1, 1.2, 0.9);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xFFFFFF,
          shininess: 100
        });
        const mainBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.add(mainBody);
        
        // Head with face screen
        const headGeometry = new THREE.SphereGeometry(0.8, 32, 32);
        const headMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xFFFFFF,
          shininess: 100
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0.9, 0);
        body.add(head);
        
        // Face screen (black oval)
        const screenGeometry = new THREE.SphereGeometry(0.6, 32, 32);
        screenGeometry.scale(1, 0.8, 0.4);
        const screenMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x111111,
          shininess: 90
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, 0, 0.5);
        head.add(screen);
        
        // Eyes (cyan half-circles)
        const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.8);
        const eyeMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x00E5FF,
          emissive: 0x00E5FF,
          emissiveIntensity: 0.5
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 0, 0.25);
        leftEye.rotation.x = Math.PI * 0.2;
        screen.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 0, 0.25);
        rightEye.rotation.x = Math.PI * 0.2;
        screen.add(rightEye);
        
        // Head turquoise cap
        const capGeometry = new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const capMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x4DEEEA, 
          shininess: 80
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.set(0, 0.7, 0);
        cap.rotation.x = -Math.PI * 0.5;
        head.add(cap);
        
        // Arms
        const armGeometry = new THREE.CapsuleGeometry(0.2, 0.6, 8, 8);
        const armMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x4DEEEA
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.8, 0.3, 0);
        leftArm.rotation.z = Math.PI * 0.3;
        body.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.8, 0.3, 0);
        rightArm.rotation.z = -Math.PI * 0.3;
        body.add(rightArm);
        
        // Ears/sensors
        const earGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const earMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xCCCCCC
        });
        
        // Left ear
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.8, 0.7, 0);
        leftEar.scale.set(0.8, 1, 0.5);
        head.add(leftEar);
        
        // Right ear
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.8, 0.7, 0);
        rightEar.scale.set(0.8, 1, 0.5);
        head.add(rightEar);
        
        // Turquoise chest piece
        const chestGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        chestGeometry.scale(1.2, 0.8, 0.5);
        const chestMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x4DEEEA
        });
        const chest = new THREE.Mesh(chestGeometry, chestMaterial);
        chest.position.set(0, 0.2, 0.5);
        mainBody.add(chest);
        
        // Name tag "Eilik"
        const createTextMesh = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 128;
          canvas.height = 64;
          const context = canvas.getContext('2d');
          if (context) {
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = 'bold 40px Arial';
            context.fillStyle = '#000000';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('Eilik', canvas.width / 2, canvas.height / 2);

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.MeshBasicMaterial({ map: texture });
            const geometry = new THREE.PlaneGeometry(0.6, 0.3);
            const textMesh = new THREE.Mesh(geometry, material);
            textMesh.position.set(0, -0.1, 0.55);
            mainBody.add(textMesh);
          }
        };
        
        createTextMesh();
        
        // Add robot to scene
        robotScene.add(body);
        
        // Lighting
        const ambLight = new THREE.AmbientLight(0xffffff, 0.5);
        robotScene.add(ambLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(2, 5, 5);
        robotScene.add(dirLight);
        
        // Base for robot
        const baseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
        const baseMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, -1.2, 0);
        body.add(base);
        
        // Position camera
        robotCamera.position.z = 4;
        
        // Animation function
        function animateRobot() {
          requestAnimationFrame(animateRobot);
          
          // Add subtle floating motion
          const time = Date.now() * 0.001;
          body.position.y = Math.sin(time) * 0.1;
          
          // Gentle rotation to show 3D nature
          body.rotation.y = Math.sin(time * 0.5) * 0.2;
          
          // Blink eyes occasionally
          if (Math.random() < 0.01) {
            leftEye.scale.set(1, 0.1, 1);
            rightEye.scale.set(1, 0.1, 1);
            setTimeout(() => {
              leftEye.scale.set(1, 1, 1);
              rightEye.scale.set(1, 1, 1);
            }, 150);
          }
          
          // Arm movement
          leftArm.rotation.z = Math.PI * 0.3 + Math.sin(time * 0.8) * 0.1;
          rightArm.rotation.z = -Math.PI * 0.3 + Math.sin(time * 0.8 + 1) * 0.1;
          
          robotRenderer.render(robotScene, robotCamera);
        }
        
        animateRobot();
      };
      
      // Call the robot creation function
      createRobot();
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Three.js canvas background */}
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full -z-10"
      />
      
      {/* Overlay for scene transition */}
      <div 
        ref={overlayRef} 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-green-600 opacity-0 z-30"
      ></div>
      
      {/* Game introduction content */}
      <div 
        ref={mainContentRef}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-white"
      >
        <h1 
          ref={titleRef}
          className="text-4xl md:text-6xl font-bold text-center mb-8 text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
        >
          Pika <br/>
          <span className="text-2xl md:text-3xl">Hành Trình Phát Âm Vượt Biển Nguy Hiểm</span>
        </h1>
        
        {/* Robot character */}
        <div className="relative w-40 h-40 mb-8">
          <div id="robot-container" className="w-full h-full"></div>
        </div>
        
        <div 
          ref={storyRef}
          className="max-w-2xl bg-black/40 backdrop-blur-sm p-6 rounded-lg mb-12"
        >
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-center">Tổng Quan Câu Chuyện</h2>
          <p className="text-base md:text-lg leading-relaxed">
            Pika – chú robot đáng yêu – rơi xuống một hòn đảo nhiệt đới xa lạ. Để thoát khỏi đây, 
            Pika phải xây dựng một chiếc bè và vượt biển, nhưng chỉ có những phát âm tiếng Anh đúng chuẩn từ trẻ nhỏ 
            mới tạo ra "sức gió" giúp cậu vượt qua các hiểm họa thiên nhiên như đá ngầm, cá mập, bão tố, và các thử thách khác. 
            Trẻ em sẽ đồng hành cùng Pika qua 5 giai đoạn, mỗi giai đoạn là một bài học phát âm kết hợp với hành động hồi hộp, mạo hiểm.
          </p>
        </div>
        
        {/* Nút bắt đầu với hiệu ứng đơn giản */}
        <div className="relative perspective-500">
          <button 
            ref={ctaRef}
            className="relative bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-5 px-10 rounded-full text-2xl shadow-xl hover:from-orange-500 hover:to-yellow-400 overflow-hidden transition-colors cursor-pointer"
            style={{ animation: 'pulse 2s infinite' }}
            onClick={handleStartGame}
            onMouseMove={handleButtonMouseMove as any}
            onMouseLeave={handleButtonMouseLeave}
          >
            Bắt Đầu Hành Trình
            <span className="absolute top-0 left-[-100%] h-full w-20 bg-white opacity-30 transform rotate-30 z-0" style={{ animation: 'shinyEffect 4s ease-in-out infinite 1s' }}></span>
          </button>
          
          {showParticles && (
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => {
                const size = Math.random() * 8 + 4;
                return (
                  <div
                    key={i}
                    className="absolute rounded-full bg-yellow-300"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animation: `particleFade ${Math.random() * 2 + 1}s ease-out infinite ${Math.random() * 2}s`
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Thêm sấm sét
const createLightningShape = () => {
  // Tạo hình dạng sấm sét hình chữ Z
  const points = [];
  const segments = 6; // Số đoạn của tia sét
  const zigzagFactor = 0.8; // Độ lớn của zigzag
  
  // Điểm đầu (trên cao)
  points.push(new THREE.Vector3(0, 5, 0));
  
  // Tạo các đoạn zigzag
  for (let i = 1; i < segments; i++) {
    const progress = i / segments;
    const y = 5 - progress * 10; // Từ trên xuống dưới
    
    // Tạo hiệu ứng zigzag hình chữ Z
    const xOffset = (i % 2 === 1) ? zigzagFactor : -zigzagFactor;
    points.push(new THREE.Vector3(xOffset, y, 0));
  }
  
  // Tạo đường dẫn từ các điểm
  const lightningPath = new THREE.CatmullRomCurve3(points);
  
  // Tạo geometry từ đường dẫn
  const lightningGeometry = new THREE.TubeGeometry(
    lightningPath,
    20,  // Số đoạn chia
    0.05, // Bán kính của ống
    8,    // Số cạnh tròn
    false // Không đóng ống
  );
  
  return lightningGeometry;
};
