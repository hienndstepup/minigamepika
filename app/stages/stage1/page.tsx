"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import * as THREE from "three";
import { useRouter } from "next/navigation";

export default function Stage1() {
  const canvasRef = useRef(null);
  const contentRef = useRef(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isFromTransition, setIsFromTransition] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Kiểm tra xem người dùng có đến từ trang chủ thông qua hiệu ứng chuyển cảnh không
    const hasTransition = localStorage.getItem('game_transition') === 'true';
    const transitionTime = parseInt(localStorage.getItem('transition_time') || '0');
    const currentTime = Date.now();
    const isRecentTransition = currentTime - transitionTime < 3000; // Chỉ coi là transition nếu trong vòng 3 giây

    setIsFromTransition(hasTransition && isRecentTransition);

    // Xóa dữ liệu sau khi sử dụng
    if (hasTransition) {
      localStorage.removeItem('game_transition');
      localStorage.removeItem('transition_time');
    }

    // Tạo timeline cho animation
    const tl = gsap.timeline();

    if (hasTransition && isRecentTransition) {
      // Nếu đến từ chuyển cảnh, bắt đầu với overlay và fade out
      tl.fromTo(overlayRef.current, 
        { 
          opacity: 1,
          scale: 15
        }, 
        {
          scale: 1,
          opacity: 0,
          duration: 1.2,
          ease: "power2.out",
          onComplete: () => {
            if (overlayRef.current) {
              overlayRef.current.style.display = 'none';
            }
          }
        }
      );

      // Sau đó hiện nội dung
      tl.from(contentRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.5");
    } else {
      // Nếu không đến từ chuyển cảnh, chỉ hiện nội dung bình thường
      tl.from(contentRef.current, {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: "power2.out"
      });

      // Ẩn overlay
      if (overlayRef.current) {
        overlayRef.current.style.display = 'none';
      }
    }

    // Thiết lập Three.js cho khung cảnh rừng rậm
    if (canvasRef.current) {
      // Thiết lập scene
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ 
        canvas: canvasRef.current,
        antialias: true,
        alpha: true 
      });
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x005500, 0.3); // Nền xanh lá đậm cho khung cảnh rừng
      
      // Thêm ánh sáng
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      // Ánh sáng hướng - giống ánh nắng xuyên qua lá cây
      const directionalLight = new THREE.DirectionalLight(0xffd28a, 1);
      directionalLight.position.set(5, 10, 5);
      scene.add(directionalLight);
      
      // Tạo mặt đất
      const groundGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: '#2a3e19',
        side: THREE.DoubleSide
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -2;
      scene.add(ground);
      
      // Tạo một vài cây đơn giản
      function createTree(x: number, z: number) {
        // Thân cây
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 0, z);
        scene.add(trunk);
        
        // Lá cây
        const leavesGeometry = new THREE.ConeGeometry(2, 4, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x2E8B57 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(x, 4, z);
        scene.add(leaves);
      }
      
      // Tạo một vài cây ngẫu nhiên
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 50 - 25;
        const z = Math.random() * 50 - 25;
        createTree(x, z);
      }
      
      // Tạo chiếc bè đơn giản
      const raftGroup = new THREE.Group();
      
      // Các khúc gỗ của bè
      for (let i = 0; i < 5; i++) {
        const logGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
        const logMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const log = new THREE.Mesh(logGeometry, logMaterial);
        log.rotation.z = Math.PI / 2;
        log.position.set(0, -0.5, -2 + i * 0.7);
        raftGroup.add(log);
      }
      
      // Thêm bè vào scene
      raftGroup.position.set(0, -1, 0);
      scene.add(raftGroup);
      
      camera.position.set(0, 1, 10);
      
      // Nếu đến từ chuyển cảnh, thêm hiệu ứng cho camera và bè
      if (isFromTransition) {
        // Hiệu ứng zoom camera từ xa vào
        gsap.fromTo(camera.position, 
          { z: 20 }, 
          { z: 10, duration: 2, ease: "power2.out" }
        );
        
        // Hiệu ứng bè từ dưới nước trồi lên
        gsap.fromTo(raftGroup.position, 
          { y: -3 }, 
          { y: -1, duration: 1.5, ease: "elastic.out(1, 0.5)" }
        );
      }
      
      // Hàm animation
      function animate() {
        requestAnimationFrame(animate);
        
        // Làm cho bè nhẹ nhàng lên xuống
        const t = Date.now() * 0.001;
        raftGroup.position.y = -1 + Math.sin(t) * 0.1;
        
        // Làm cho lá cây lắc lư mạnh mẽ hơn như có gió lớn
        scene.children.forEach(child => {
          if (child instanceof THREE.Mesh && 
              child.geometry instanceof THREE.ConeGeometry) {
            // Tăng biên độ chuyển động của lá cây (từ 0.05 lên 0.15)
            child.rotation.z = Math.sin(t + child.position.x) * 0.15;
            // Thêm chuyển động cho phần y để tạo cảm giác bão táp
            child.rotation.x = Math.cos(t * 1.2 + child.position.z) * 0.08;
            // Thêm nhẹ chuyển động cho thân cây
            if (child.position.y > 3) { // Chỉ áp dụng cho phần lá cây
              child.position.y += Math.sin(t * 0.8) * 0.03;
            }
          }
          
          // Thêm chuyển động cho thân cây
          if (child instanceof THREE.Mesh && 
              child.geometry instanceof THREE.CylinderGeometry &&
              child.position.y < 3) { // Chỉ áp dụng cho thân cây
            // Thân cây chuyển động nhẹ hơn nhưng vẫn đủ để cảm nhận
            child.rotation.z = Math.sin(t * 0.5 + child.position.x) * 0.03;
          }
        });
        
        renderer.render(scene, camera);
      }
      
      animate();
      
      // Xử lý khi resize cửa sổ
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // Function to handle button click
  const handleStartPractice = () => {
    router.push('/stages/stage1/practice');
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Three.js background */}
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full -z-10"
      />
      
      {/* Transition overlay - phần này sẽ hiện khi đến từ trang chủ */}
      <div 
        ref={overlayRef} 
        className="fixed top-0 left-0 w-full h-full bg-green-600 z-30"
      ></div>
      
      {/* Content */}
      <div 
        ref={contentRef}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-white"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-8 text-green-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Giai đoạn 1: Khởi đầu gian khó
          <span className="block text-2xl md:text-3xl mt-2">Bè & Rừng Rậm</span>
        </h1>
        
        <div className="max-w-2xl bg-black/40 backdrop-blur-sm p-6 rounded-lg mb-8">
          <p className="text-lg leading-relaxed">
            Cây đổ, lở đất & thú hoang – Pika cần phát âm đúng để triệu hồi các cơn gió gom nguyên liệu trước khi rừng rậm trở nên quá nguy hiểm.
          </p>
        </div>
        
        <button 
          onClick={handleStartPractice}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transition-colors"
        >
          Bắt Đầu Luyện Tập
        </button>
      </div>
    </div>
  );
} 