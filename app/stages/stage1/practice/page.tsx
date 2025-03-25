"use client";

import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import * as THREE from "three";
import { useRouter } from "next/navigation";

export default function Stage1Practice() {
  const router = useRouter();
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [materials, setMaterials] = useState({
    wood: 0,
    leaves: 0,
    rope: 0
  });
  
  // Quản lý tiến độ
  const [soundStatuses, setSoundStatuses] = useState<boolean[]>([]);
  const [currentSoundIndex, setCurrentSoundIndex] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const characterRef = useRef<THREE.Group | null>(null);
  const pathRef = useRef<THREE.Line | null>(null);
  const lightningRef = useRef<THREE.PointLight | null>(null);
  const lastLightningTime = useRef(0);

  // Danh sách âm luyện tập
  const practiceSounds = [
    { type: "vowel", sound: "/æ/", example: "cat", description: "Nguyên âm ngắn" },
    { type: "vowel", sound: "/ɛ/", example: "bed", description: "Nguyên âm ngắn" },
    { type: "vowel", sound: "/ɪ/", example: "sit", description: "Nguyên âm ngắn" },
    { type: "vowel", sound: "/ɒ/", example: "hot", description: "Nguyên âm ngắn" },
    { type: "vowel", sound: "/ʌ/", example: "cup", description: "Nguyên âm ngắn" },
    { type: "consonant", sound: "/p/", example: "pen", description: "Phụ âm đơn" },
    { type: "consonant", sound: "/b/", example: "bat", description: "Phụ âm đơn" },
    { type: "consonant", sound: "/m/", example: "map", description: "Phụ âm đơn" },
    { type: "consonant", sound: "/n/", example: "net", description: "Phụ âm đơn" },
    { type: "consonant", sound: "/t/", example: "top", description: "Phụ âm đơn" },
    { type: "consonant", sound: "/d/", example: "dog", description: "Phụ âm đơn" },
  ];

  // Khởi tạo trạng thái âm khi component mount
  useEffect(() => {
    setSoundStatuses(Array(practiceSounds.length).fill(false));
    
    // Khởi tạo scene Three.js
    if (canvasRef.current) {
      initForestScene();
    }
    
    return () => {
      // Cleanup
      if (sceneRef.current) {
        // Cleanup scene resources
      }
    };
  }, []);

  // Khởi tạo scene Three.js với đường đi và nhân vật
  const initForestScene = () => {
    if (!canvasRef.current) return;
    
    // Khởi tạo scene, camera, renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x005500, 0.3);
    
    // Thêm ánh sáng
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffd28a, 1.2);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);
    
    // Thêm ánh sáng sấm sét (ban đầu tắt)
    const lightning = new THREE.PointLight(0xaaeeff, 0, 100);
    lightning.position.set(0, 20, 0);
    scene.add(lightning);
    lightningRef.current = lightning;
    
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
    
    // Tạo cây ngẫu nhiên - đảm bảo không che khuất đường đi
    for (let i = 0; i < 40; i++) {
      // Xác định vị trí x trên toàn bộ chiều dài đường đi
      const x = Math.random() * 100 - 50;
      
      // Tăng khoảng cách tối thiểu từ đường đi
      const minDistance = 12; // Khoảng cách tối thiểu từ đường đi
      
      // Tạo cây ở xa đường đi hơn để không che khuất nhân vật và đường đi
      let z;
      if (Math.random() > 0.5) {
        // Bên phải đường - xa hơn
        z = Math.random() * 30 + minDistance;
      } else {
        // Bên trái đường - xa hơn
        z = Math.random() * -30 - minDistance;
      }
      
      // Đặt cây cao hơn hoặc thấp hơn để tạo cảm giác xa gần
      const heightVariation = Math.random() * 0.4 + 0.8; // Từ 0.8 đến 1.2 lần kích thước
      
      createTree(x, z, scene, heightVariation);
    }
    
    // Tạo đường đi thẳng
    const pathPoints = [];
    const pathLength = 80; // Chiều dài đường đi
    const pathStart = -30; // Điểm bắt đầu - đưa ra trước một chút để nhìn thấy rõ
    
    // Tạo điểm của đường đi thẳng
    for (let i = 0; i <= practiceSounds.length; i++) {
      const segment = i / practiceSounds.length;
      const x = pathStart + segment * pathLength;
      pathPoints.push(new THREE.Vector3(x, -1.8, 0));
    }
    
    // Tạo đường đi
    const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 5 });
    const path = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(path);
    pathRef.current = path;
    
    // Thêm các vật liệu trên đường đi thay cho các mốc đánh dấu
    for (let i = 0; i < pathPoints.length; i++) {
      if (i === 0) continue; // Bỏ qua điểm đầu tiên
      
      // Xác định loại vật liệu dựa trên vị trí (xoay vòng gỗ, lá, dây thừng)
      const materialType = i % 3;
      const position = pathPoints[i];
      
      if (materialType === 0) {
        // Tạo gỗ (một khúc gỗ nằm ngang)
        const woodGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
        const woodMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x8B4513,
          roughness: 0.8 
        });
        const wood = new THREE.Mesh(woodGeometry, woodMaterial);
        wood.rotation.z = Math.PI / 2; // Đặt nằm ngang
        wood.position.copy(position);
        wood.position.y = -1.5; // Đặt cao hơn đường một chút
        wood.userData = { type: 'wood', collected: false, index: i };
        scene.add(wood);
      } else if (materialType === 1) {
        // Tạo lá (một tấm phẳng màu xanh)
        const leafGeometry = new THREE.CircleGeometry(0.6, 8);
        const leafMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x2E8B57,
          side: THREE.DoubleSide,
          roughness: 0.7
        });
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.rotation.x = -Math.PI / 2; // Đặt phẳng
        leaf.position.copy(position);
        leaf.position.y = -1.5;
        leaf.userData = { type: 'leaf', collected: false, index: i };
        scene.add(leaf);
      } else {
        // Tạo dây thừng (một vòng tròn)
        const ropeGeometry = new THREE.TorusGeometry(0.4, 0.1, 8, 16);
        const ropeMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xD2B48C,
          roughness: 0.6
        });
        const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
        rope.position.copy(position);
        rope.position.y = -1.5;
        rope.userData = { type: 'rope', collected: false, index: i };
        scene.add(rope);
      }
    }
    
    // Tạo nhân vật (robot)
    const characterGroup = new THREE.Group();
    
    // Thân robot
    const bodyGeometry = new THREE.BoxGeometry(1.0, 1.5, 0.6);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1e90ff,
      emissive: 0x1e90ff,
      emissiveIntensity: 0.2,
      metalness: 0.7,
      roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0;
    characterGroup.add(body);
    
    // Đầu robot
    const headGeometry = new THREE.BoxGeometry(0.8, 0.7, 0.7);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      emissive: 0x222222,
      emissiveIntensity: 0.1,
      metalness: 0.8,
      roughness: 0.2
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.2;
    characterGroup.add(head);
    
    // Mắt robot
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.8
    });
    // Mắt trái
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 1.2, 0.4);
    characterGroup.add(leftEye);
    // Mắt phải
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 1.2, 0.4);
    characterGroup.add(rightEye);
    
    // Ăng-ten robot
    const antennaGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
    const antennaMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff4500,
      emissive: 0xff4500,
      emissiveIntensity: 0.3
    });
    // Ăng-ten trái
    const leftAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    leftAntenna.position.set(-0.25, 1.65, 0);
    characterGroup.add(leftAntenna);
    // Ăng-ten phải
    const rightAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    rightAntenna.position.set(0.25, 1.65, 0);
    characterGroup.add(rightAntenna);
    // Đầu ăng-ten
    const antennaTopGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const antennaTopMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    const leftAntennaTop = new THREE.Mesh(antennaTopGeometry, antennaTopMaterial);
    leftAntennaTop.position.set(-0.25, 1.85, 0);
    leftAntennaTop.name = "leftAntennaTop";
    characterGroup.add(leftAntennaTop);
    const rightAntennaTop = new THREE.Mesh(antennaTopGeometry, antennaTopMaterial);
    rightAntennaTop.position.set(0.25, 1.85, 0);
    rightAntennaTop.name = "rightAntennaTop";
    characterGroup.add(rightAntennaTop);
    
    // Chân robot
    const legGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
    const legMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4169e1,
      metalness: 0.6,
      roughness: 0.4
    });
    // Chân trái
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, -1.0, 0);
    leftLeg.name = "leftLeg";
    characterGroup.add(leftLeg);
    // Chân phải
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, -1.0, 0);
    rightLeg.name = "rightLeg";
    characterGroup.add(rightLeg);
    
    // Tay robot
    const armGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const armMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4169e1,
      metalness: 0.6,
      roughness: 0.4
    });
    // Tay trái
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.6, 0.1, 0);
    leftArm.name = "leftArm";
    characterGroup.add(leftArm);
    // Tay phải
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.6, 0.1, 0);
    rightArm.name = "rightArm";
    characterGroup.add(rightArm);
    
    // Đặt nhân vật vào vị trí bắt đầu - đưa lên cao hơn
    characterGroup.position.copy(pathPoints[0]);
    characterGroup.position.y = -0.8;
    scene.add(characterGroup);
    characterRef.current = characterGroup;
    
    // Setup camera - điều chỉnh góc nhìn
    camera.position.set(pathStart - 10, 5, 15);
    camera.lookAt(pathStart, 0, 0);
    
    // Animation function
    function animate() {
      requestAnimationFrame(animate);
      
      // Làm cho robot di chuyển lên xuống nhẹ và xoay nhẹ
      if (characterRef.current) {
        const t = Date.now() * 0.002;
        characterRef.current.position.y = -0.8 + Math.sin(t) * 0.1;
        characterRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
        
        // Chuyển động chân tay robot khi đi
        characterRef.current.children.forEach(child => {
          if (child.name === "leftLeg") {
            child.rotation.x = Math.sin(t * 2) * 0.4;
          }
          if (child.name === "rightLeg") {
            child.rotation.x = -Math.sin(t * 2) * 0.4;
          }
          if (child.name === "leftArm") {
            child.rotation.x = -Math.sin(t * 2) * 0.3;
            child.rotation.z = Math.PI / 12 + Math.sin(t) * 0.1;
          }
          if (child.name === "rightArm") {
            child.rotation.x = Math.sin(t * 2) * 0.3;
            child.rotation.z = -Math.PI / 12 - Math.sin(t) * 0.1;
          }
          // Hiệu ứng nhấp nháy đầu ăng-ten
          if ((child.name === "leftAntennaTop" || child.name === "rightAntennaTop") && child instanceof THREE.Mesh) {
            const intensity = 0.5 + Math.sin(t * 5) * 0.4;
            child.material.emissiveIntensity = intensity;
          }
        });
      }
      
      // Làm cho lá cây chuyển động
      scene.children.forEach(child => {
        if (child instanceof THREE.Mesh && 
            child.geometry instanceof THREE.ConeGeometry) {
          // Dịch chuyển lá cây
          const t = Date.now() * 0.001;
          child.rotation.z = Math.sin(t + child.position.x) * 0.1;
        }
        
        // Làm cho vật liệu trên đường quay nhẹ nhàng hoặc nhấp nháy
        if (child instanceof THREE.Mesh && 
            (child.userData?.type === 'wood' || 
             child.userData?.type === 'leaf' || 
             child.userData?.type === 'rope')) {
          
          if (!child.userData.collected) {
            const t = Date.now() * 0.002;
            // Xoay nhẹ các vật phẩm
            child.rotation.y = Math.sin(t) * 0.5;
            
            // Thêm hiệu ứng nhấp nháy
            const scale = 1 + Math.sin(t * 2) * 0.1;
            child.scale.set(scale, scale, scale);
          }
        }
      });
      
      // Hiệu ứng sấm sét ngẫu nhiên
      const time = Date.now();
      if (time - lastLightningTime.current > 5000) { // Thời gian giữa các lần sấm sét ít nhất 5 giây
        // 2% cơ hội mỗi khung hình để có sấm sét
        if (Math.random() < 0.005 && lightningRef.current) {
          // Tạo vị trí sấm sét ngẫu nhiên
          const x = Math.random() * 60 - 30;
          const z = Math.random() * 60 - 30;
          lightningRef.current.position.set(x, 20, z);
          
          // Đèn flash
          lightningRef.current.intensity = 2 + Math.random() * 3;
          
          // Thêm tiếng sấm sét (mô phỏng bằng feedback)
          if (isPracticing) {
            setFeedback("⚡ Cẩn thận! Sấm sét đang đánh gần đây!");
            setTimeout(() => {
              if (feedback.includes("⚡")) setFeedback("");
            }, 2000);
          }
          
          // Tạo hiệu ứng tắt dần
          gsap.to(lightningRef.current, {
            intensity: 0,
            duration: 0.2 + Math.random() * 0.2,
            onComplete: () => {
              // Thỉnh thoảng có sấm sét kép
              if (Math.random() < 0.3 && lightningRef.current) {
                setTimeout(() => {
                  if (lightningRef.current) {
                    lightningRef.current.intensity = 1.5 + Math.random() * 2;
                    gsap.to(lightningRef.current, {
                      intensity: 0,
                      duration: 0.1 + Math.random() * 0.1
                    });
                  }
                }, 100);
              }
            }
          });
          
          // Cập nhật thời gian sấm sét cuối cùng
          lastLightningTime.current = time;
        }
      }
      
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
  };

  // Helper function to create a tree
  const createTree = (x: number, z: number, scene: THREE.Scene, scale: number = 1) => {
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3 * scale, 0.4 * scale, 3 * scale, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 0.8
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, -0.5, z);
    scene.add(trunk);
    
    // Tree leaves
    const leavesGeometry = new THREE.ConeGeometry(1.5 * scale, 3 * scale, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2E8B57,
      roughness: 0.7
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 2.5 * scale, z);
    
    // Thêm một chút xoay ngẫu nhiên cho cây để trông tự nhiên hơn
    leaves.rotation.y = Math.random() * Math.PI * 2;
    trunk.rotation.y = Math.random() * Math.PI * 2;
    
    scene.add(leaves);
  };

  // Di chuyển nhân vật dọc theo đường đi và thu thập vật liệu
  const moveCharacterToPosition = (index: number) => {
    if (!characterRef.current || !pathRef.current || !sceneRef.current) return;
    
    // Lấy đường đi từ geometry
    const positions = (pathRef.current.geometry as THREE.BufferGeometry).attributes.position;
    
    // Nếu không có đủ điểm, return
    if (index >= positions.count) return;
    
    // Lấy vị trí mới
    const x = positions.getX(index);
    const y = -0.8; // Cao độ cố định cho nhân vật - giữ nhất quán
    const z = positions.getZ(index);
    
    // Tạo animation di chuyển
    gsap.to(characterRef.current.position, {
      x,
      z,
      duration: 1,
      ease: "power2.out",
      onUpdate: () => {
        // Tìm camera trong scene
        const cameras: THREE.PerspectiveCamera[] = [];
        sceneRef.current?.traverse(child => {
          if (child instanceof THREE.PerspectiveCamera) {
            cameras.push(child);
          }
        });
        
        // Nếu có camera
        if (cameras.length > 0) {
          const camera = cameras[0];
          // Di chuyển camera để theo dõi nhân vật
          gsap.to(camera.position, {
            x: x - 10,
            duration: 1,
            ease: "power2.out"
          });
          
          // Điều chỉnh lookAt của camera
          camera.lookAt(x, 0, 0);
        }
      },
      onComplete: () => {
        // Khi đến nơi, thu thập vật liệu tại mốc này nếu có
        collectMaterialAtPosition(index);
      }
    });
  };

  // Hàm thu thập vật liệu tại vị trí hiện tại
  const collectMaterialAtPosition = (index: number) => {
    if (!sceneRef.current) return;
    
    // Tìm vật liệu ở vị trí index
    sceneRef.current.children.forEach(child => {
      if (child instanceof THREE.Mesh && 
          child.userData && 
          child.userData.index === index && 
          !child.userData.collected) {
        
        // Đánh dấu đã thu thập
        child.userData.collected = true;
        
        // Hiệu ứng thu thập - bay lên và biến mất
        gsap.to(child.position, {
          y: child.position.y + 3,
          duration: 1,
          ease: "power2.out"
        });
        
        gsap.to(child.scale, {
          x: 0.1,
          y: 0.1, 
          z: 0.1,
          duration: 1,
          ease: "power2.in",
          onComplete: () => {
            child.visible = false;
          }
        });
        
        // Cập nhật số lượng vật liệu tương ứng
        if (child.userData.type === 'wood') {
          setMaterials(prev => ({ ...prev, wood: prev.wood + 1 }));
        } else if (child.userData.type === 'leaf') {
          setMaterials(prev => ({ ...prev, leaves: prev.leaves + 1 }));
        } else if (child.userData.type === 'rope') {
          setMaterials(prev => ({ ...prev, rope: prev.rope + 1 }));
        }
      }
    });
  };

  // Cập nhật hàm collectMaterial để gọi đến collectMaterialAtPosition
  const collectMaterial = () => {
    // Không cần thêm logic ngẫu nhiên nữa vì vật liệu đã được thu thập trực tiếp
    // trong hàm collectMaterialAtPosition
  };

  // Hàm bắt đầu luyện tập
  const startPractice = () => {
    setIsPracticing(true);
    setCurrentSoundIndex(0);
    setSoundStatuses(Array(practiceSounds.length).fill(false));
    
    // Di chuyển nhân vật về vị trí bắt đầu
    moveCharacterToPosition(0);
  };

  // Hàm xử lý khi nhấn nút microphone
  const handleMicClick = () => {
    // Mô phỏng quá trình ghi âm
    if (isRecording) {
      // Đã ghi âm xong, kiểm tra phát âm
      setIsRecording(false);
      setFeedback("Đang phân tích...");
      
      // Mô phỏng việc kiểm tra phát âm với thời gian xử lý
      setTimeout(() => {
        // ĐƠN GIẢN: Cứ giả sử phát âm đúng (để tập trung vào logic tiến độ)
        const isCorrect = true;
        
        if (isCorrect) {
          // Phát âm đúng
          setFeedback("Tuyệt vời! Phát âm chính xác.");
          
          // Thêm vật liệu
          collectMaterial();
          
          // Cập nhật trạng thái của âm hiện tại
          setSoundStatuses(prevStatuses => {
            const newStatuses = [...prevStatuses];
            newStatuses[currentSoundIndex] = true;
            return newStatuses;
          });
          
          // Di chuyển nhân vật đến vị trí tiếp theo
          moveCharacterToPosition(currentSoundIndex + 1);
          
          // Chuyển sang âm tiếp theo sau 1.5 giây
          setTimeout(() => {
            setFeedback("");
            
            // Tính toán âm tiếp theo
            const nextIndex = (currentSoundIndex + 1) % practiceSounds.length;
            
            // Kiểm tra nếu đã hoàn thành hết một vòng
            if (nextIndex === 0) {
              // Reset
              setSoundStatuses(Array(practiceSounds.length).fill(false));
              collectBonusMaterials();
              setFeedback("Tuyệt vời! Bạn đã hoàn thành tất cả các âm. Bắt đầu lại từ đầu!");
              
              // Di chuyển nhân vật về vị trí bắt đầu với animation
              moveCharacterToPosition(0);
            }
            
            // Cập nhật âm hiện tại
            setCurrentSoundIndex(nextIndex);
          }, 1500);
        } else {
          // Giữ nguyên âm hiện tại nếu phát âm sai (không xảy ra trong demo này)
          setFeedback("Hãy thử lại. Tập trung vào âm.");
          setTimeout(() => setFeedback(""), 2000);
        }
      }, 1000);
    } else {
      // Bắt đầu ghi âm
      setIsRecording(true);
      setFeedback("");
    }
  };

  const collectBonusMaterials = () => {
    // Thưởng thêm khi hoàn thành một vòng
    setMaterials(prev => ({
      wood: prev.wood + 2,
      leaves: prev.leaves + 2,
      rope: prev.rope + 1
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Tính toán tiến độ
  const completedCount = soundStatuses.filter(Boolean).length;
  const progressPercent = (completedCount / practiceSounds.length) * 100;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Three.js background */}
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full -z-10"
      />
      
      {/* Content container */}
      <div 
        ref={contentRef}
        className="relative z-10 flex flex-col items-center justify-start min-h-screen p-6 text-white"
      >
        {!isPracticing ? (
          // Màn hình giới thiệu - không thay đổi
          <div className="max-w-3xl w-full bg-black/80 p-8 rounded-xl shadow-lg">
            {/* Nội dung giới thiệu */}
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-6 text-green-300">
              Luyện Tập Phát Âm
            </h1>
            
            <h2 className="text-2xl font-bold mb-4 text-white">
              Giai đoạn 1: Khởi đầu gian khó – Bè & Rừng Rậm
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-green-900/50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-2 text-green-200">Âm luyện tập:</h3>
                <div className="ml-4 space-y-1 text-white">
                  <p><span className="font-medium">Nguyên âm ngắn:</span> /æ/, /ɛ/, /ɪ/, /ɒ/, /ʌ/</p>
                  <p><span className="font-medium">Phụ âm đơn:</span> /p/, /b/, /m/, /n/, /t/, /d/</p>
                </div>
              </div>
              
              <div className="bg-green-900/50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-2 text-green-200">Nguy hiểm:</h3>
                <p className="text-white">
                  🌴 Cây đổ, lở đất & thú hoang – Pika cần phát âm đúng để triệu hồi các cơn gió gom nguyên liệu trước khi rừng rậm trở nên quá nguy hiểm.
                </p>
              </div>
            </div>
            
            <button 
              onClick={startPractice}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-all hover:scale-105"
            >
              Bắt Đầu Luyện Tập
            </button>
          </div>
        ) : (
          // Màn hình luyện tập với nhân vật di chuyển trên đường
          <div className="w-full h-full flex flex-col">
            {/* Game stats panel */}
            <div className="bg-black/80 p-4 rounded-xl shadow-lg">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                {/* Timer */}
                <div className="bg-green-900/60 px-4 py-2 rounded-lg flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xl font-bold text-white">{formatTime(timeLeft)}</span>
                </div>
                
                {/* Materials */}
                <div className="flex space-x-4">
                  <div className="bg-green-900/60 px-3 py-2 rounded-lg text-center">
                    <span className="block text-sm text-green-200">Gỗ</span>
                    <span className="text-xl font-bold text-white">{materials.wood}</span>
                  </div>
                  <div className="bg-green-900/60 px-3 py-2 rounded-lg text-center">
                    <span className="block text-sm text-green-200">Lá</span>
                    <span className="text-xl font-bold text-white">{materials.leaves}</span>
                  </div>
                  <div className="bg-green-900/60 px-3 py-2 rounded-lg text-center">
                    <span className="block text-sm text-green-200">Dây thừng</span>
                    <span className="text-xl font-bold text-white">{materials.rope}</span>
                  </div>
                </div>
              </div>
              
              {/* Progress bar - với key để force re-render */}
              <div className="mt-3 w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  key={completedCount}
                  className="bg-green-500 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              
              {/* Tiến độ */}
              <div className="text-xs text-green-200 text-right mt-1">
                Tiến độ: {completedCount}/{practiceSounds.length} âm
              </div>
            </div>
            
            {/* Khu vực chính - hiển thị phản hồi */}
            <div className="flex-grow relative">
              {/* Hiển thị phản hồi ở giữa màn hình nếu có */}
              {feedback && (
                <div className={`absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                  text-2xl p-4 rounded-lg shadow-lg ${
                  feedback === "Đang phân tích..." 
                    ? 'bg-blue-900/80 text-blue-300' 
                    : feedback.includes('Tuyệt vời') 
                      ? 'bg-green-900/80 text-green-300' 
                      : 'bg-yellow-900/80 text-yellow-300'
                }`}>
                  {feedback}
                </div>
              )}
            </div>
            
            {/* Pronunciation panel - ở góc dưới bên phải */}
            <div className="fixed bottom-6 right-6 z-20">
              <div className="bg-black/80 p-4 rounded-xl shadow-lg w-64">
                <div className="flex flex-col items-center">
                  <div key={currentSoundIndex} className="text-3xl font-bold mb-1 text-white">
                    {practiceSounds[currentSoundIndex].sound}
                  </div>
                  <div className="text-sm text-green-200 mb-2">
                    {practiceSounds[currentSoundIndex].example}
                  </div>
                  
                  <div className="relative w-full h-10 mb-2 bg-green-800/30 rounded-full overflow-hidden">
                    {/* Audio visualization */}
                    <div className="absolute bottom-0 left-0 w-full h-full flex items-end justify-center">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div 
                          key={i}
                          className={`mx-px bg-green-400 ${isRecording ? 'animate-pulse' : ''}`}
                          style={{ 
                            height: isRecording ? `${20 + Math.random() * 60}%` : '20%',
                            width: '4px',
                            animationDuration: `${0.8 + Math.random() * 0.6}s`
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Microphone button */}
                  <button 
                    onClick={handleMicClick}
                    className={`flex items-center justify-center p-3 rounded-full shadow-lg transition-all ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-6 w-6 text-white" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
                      />
                    </svg>
                  </button>
                  
                  <p className="text-xs mt-1 text-green-200">
                    {isRecording ? "Đang thu âm" : "Nhấn để thu âm"}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="fixed bottom-6 left-6 max-w-xs bg-black/60 p-3 rounded-lg text-center">
              <p className="text-xs text-green-200">
                Phát âm đúng để di chuyển trên đường và thu thập nguyên liệu. 
                Hoàn thành hành trình để thoát khỏi rừng rậm!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
