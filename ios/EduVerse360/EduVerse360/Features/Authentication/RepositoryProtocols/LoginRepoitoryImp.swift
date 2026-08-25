//
//  LoginMockAPI.swift
//  EduVerse360
//
//  Created by Ekta Rai on 12/07/2026.
//

import Foundation
import Combine

enum LoginError: Error {
    case invalidCredentials
    case invalidUsername
    case invalidPassword
    case fieldsAreRequired
    case usernameEmpty
    case passwordEmpty
    case userNotFound
    case Passwordmustbeatleast8Characters
    
}

class LoginMockAPI : LoginAPIProtocol {
    private let dummydb : [UserModel] = [
        UserModel(id: 1, firstName: "Ekta", lastName: "Rai", userName:"ektarai@gmail.com", password: "12345678"),
        UserModel(id: 2, firstName: "Kanaklata", lastName: "Rai", userName: "kanak@gmail.com", password: "12345678")
        
    ]
    
    
    func login(req: LoginRequest) async throws -> LoginResponse{
        
        if (req.password.isEmpty && req.username.isEmpty){
            throw LoginError.fieldsAreRequired
        }
        
        if (req.username.isEmpty){
            throw LoginError.usernameEmpty
        }
        
        if (req.password.isEmpty){
            throw LoginError.passwordEmpty
        }
        if (req.password.count < 8){
            throw LoginError.Passwordmustbeatleast8Characters
        }
       
        
        let isUserAvailableInDb:Bool = dummydb.contains { user in
            let isValidUser = user.userName.lowercased() == req.username.lowercased() && user.password == req.password
            return isValidUser
        }
        
//        if isUserAvailableInDb {
//            return LoginResponse(token: "token1234567890")
//        }else{
//            throw LoginError.invalidCredentials
//        }
//        
        
        guard isUserAvailableInDb else{
            throw LoginError.userNotFound
        }
    
        return LoginResponse(token: "token1234567890")
        
        
    }
}
