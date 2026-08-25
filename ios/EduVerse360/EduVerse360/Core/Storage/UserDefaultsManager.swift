//
//  UserDefaultsManager.swift
//  EduVerse360
//
//  Created by Ekta Rai on 12/07/2026.
//
import Foundation

struct UserDefaultsManager{
    static let shared = UserDefaultsManager()
    private init(){}
    
    private let standard = UserDefaults.standard
    
    enum UserDefaultKeys : String{
        case token = "token"
        case refreshToken = "refresh_token"
        case usename = "usename"
        case firstName = "first_name"
        case lastName = "last_name"
        
    }
    
    //String
    func save (data: String, key:UserDefaultKeys){
        standard.set(data, forKey: key.rawValue)
    }
    
    func read(key:UserDefaultKeys) -> String?{
        return standard.string(forKey: key.rawValue)
        
    }
    
    //Integer
    
    func save(data:Int, key:UserDefaultKeys){
        standard.set(data, forKey: key.rawValue)
    }
    
    func read(key:UserDefaultKeys) -> Int{
        return standard.integer(forKey: key.rawValue)
    }
    
    //Boolean
    
    func save(data:Bool, key:UserDefaultKeys){
        standard.set(data, forKey: key.rawValue)
    }
    
    func read(key:UserDefaultKeys) -> Bool{
        return standard.bool(forKey: key.rawValue)
    }
}
