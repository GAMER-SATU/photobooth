//
//  PhotoModel.swift
//  DuetPhotobooth
//

import UIKit

public struct PhotoModel: Identifiable, Equatable {
    public let id: String
    public var image: UIImage
    public var caption: String
    public var stickers: [StickerInstance]
    public let timestamp: Date
    public var filter: FilterType
    public var rotation: Double
    
    public init(
        id: String = UUID().uuidString,
        image: UIImage,
        caption: String = "",
        stickers: [StickerInstance] = [],
        timestamp: Date = Date(),
        filter: FilterType = .original,
        rotation: Double = 0.0
    ) {
        self.id = id
        self.image = image
        self.caption = caption
        self.stickers = stickers
        self.timestamp = timestamp
        self.filter = filter
        self.rotation = rotation
    }
    
    public static func == (lhs: PhotoModel, rhs: PhotoModel) -> Bool {
        lhs.id == rhs.id &&
        lhs.caption == rhs.caption &&
        lhs.stickers == rhs.stickers &&
        lhs.filter == rhs.filter
    }
}
