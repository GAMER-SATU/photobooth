//
//  CameraManager.swift
//  DuetPhotobooth
//

import AVFoundation
import UIKit
import Combine

public final class CameraManager: NSObject, ObservableObject {
    @Published public var isCameraReady: Bool = false
    @Published public var permissionDenied: Bool = false
    @Published public var currentFrame: UIImage?
    
    public let captureSession = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    private let videoOutput = AVCaptureVideoDataOutput()
    private var photoCompletion: ((UIImage?) -> Void)?
    private let sessionQueue = DispatchQueue(label: "com.duet.cameraQueue")
    
    public override init() {
        super.init()
        checkPermissions()
    }
    
    public func checkPermissions() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            setupSession()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                DispatchQueue.main.async {
                    if granted {
                        self?.setupSession()
                    } else {
                        self?.permissionDenied = true
                    }
                }
            }
        default:
            DispatchQueue.main.async {
                self.permissionDenied = true
            }
        }
    }
    
    private func setupSession() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            self.captureSession.beginConfiguration()
            self.captureSession.sessionPreset = .photo
            
            // Look for front TrueDepth / Wide camera
            let discovery = AVCaptureDevice.DiscoverySession(
                deviceTypes: [.builtInWideAngleCamera, .builtInTrueDepthCamera],
                mediaType: .video,
                position: .front
            )
            
            guard let frontCamera = discovery.devices.first,
                  let input = try? AVCaptureDeviceInput(device: frontCamera),
                  self.captureSession.canAddInput(input) else {
                self.captureSession.commitConfiguration()
                DispatchQueue.main.async { self.isCameraReady = false }
                return
            }
            
            self.captureSession.addInput(input)
            
            if self.captureSession.canAddOutput(self.photoOutput) {
                self.captureSession.addOutput(self.photoOutput)
            }
            
            if self.captureSession.canAddOutput(self.videoOutput) {
                self.videoOutput.setSampleBufferDelegate(self, queue: DispatchQueue(label: "com.duet.videoFrames"))
                self.videoOutput.alwaysDiscardsLateVideoFrames = true
                self.captureSession.addOutput(self.videoOutput)
                
                // Mirror front camera
                if let connection = self.videoOutput.connection(with: .video), connection.isVideoMirroringSupported {
                    connection.isVideoMirrored = true
                }
            }
            
            self.captureSession.commitConfiguration()
            self.captureSession.startRunning()
            
            DispatchQueue.main.async {
                self.isCameraReady = true
                self.permissionDenied = false
            }
        }
    }
    
    public func capturePhoto(completion: @escaping (UIImage?) -> Void) {
        // If running on simulator or camera not active, generate a stylish demo photo
        #if targetEnvironment(simulator)
        completion(generateSimulatorPhoto())
        return
        #endif
        
        guard isCameraReady else {
            completion(generateSimulatorPhoto())
            return
        }
        
        photoCompletion = completion
        let settings = AVCapturePhotoSettings()
        photoOutput.capturePhoto(with: settings, delegate: self)
    }
    
    // Generates a mock vintage photobooth portrait for simulator testing
    private func generateSimulatorPhoto() -> UIImage {
        let size = CGSize(width: 960, height: 540)
        UIGraphicsBeginImageContextWithOptions(size, false, 1.0)
        let ctx = UIGraphicsGetCurrentContext()!
        
        // Cream studio background
        ctx.setFillColor(UIColor(red: 0xF7/255.0, green: 0xF4/255.0, blue: 0xEC/255.0, alpha: 1.0).cgColor)
        ctx.fill(CGRect(origin: .zero, size: size))
        
        // Vignette
        let colors = [UIColor.clear.cgColor, UIColor(white: 0.1, alpha: 0.15).cgColor] as CFArray
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        if let gradient = CGGradient(colorsSpace: colorSpace, colors: colors, locations: [0.6, 1.0]) {
            ctx.drawRadialGradient(
                gradient,
                startCenter: CGPoint(x: size.width/2, y: size.height/2),
                startRadius: size.height * 0.4,
                endCenter: CGPoint(x: size.width/2, y: size.height/2),
                endRadius: size.width * 0.6,
                options: []
            )
        }
        
        // Silhouette portrait placeholder
        ctx.setFillColor(UIColor(red: 0x32/255.0, green: 0x30/255.0, blue: 0x36/255.0, alpha: 0.85).cgColor)
        ctx.fillEllipse(in: CGRect(x: size.width/2 - 90, y: 110, width: 180, height: 210))
        ctx.fillEllipse(in: CGRect(x: size.width/2 - 180, y: 300, width: 360, height: 320))
        
        let img = UIGraphicsGetImageFromCurrentImageContext()!
        UIGraphicsEndImageContext()
        return img
    }
}

extension CameraManager: AVCapturePhotoCaptureDelegate {
    public func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        guard let data = photo.fileDataRepresentation(),
              let original = UIImage(data: data) else {
            photoCompletion?(nil)
            return
        }
        
        // Mirror the image horizontally since it's front camera
        if let cgImage = original.cgImage {
            let mirrored = UIImage(cgImage: cgImage, scale: original.scale, orientation: .leftMirrored)
            photoCompletion?(mirrored)
        } else {
            photoCompletion?(original)
        }
    }
}

extension CameraManager: AVCaptureVideoDataOutputSampleBufferDelegate {
    public func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard let imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        let ciImage = CIImage(cvPixelBuffer: imageBuffer)
        let context = CIContext()
        if let cgImage = context.createCGImage(ciImage, from: ciImage.extent) {
            let uiImage = UIImage(cgImage: cgImage)
            DispatchQueue.main.async {
                self.currentFrame = uiImage
            }
        }
    }
}
