//
//  LoginViewModel.swift
//  EduVerse360
//
//  Created by Ekta Rai on 12/07/2026.
//
import Foundation
import Observation


@Observable

class LoginViewModel{

    var password = ""
    var userName = ""
    var rememberMe = false
    var isLoading = false
    var token = ""
    var errorMessage: String?
    
    var isLoginSucceess = false
    
    
    private let loginService : LoginAPIProtocol
    init (loginservice:LoginAPIProtocol = LoginMockAPI()){
        self.loginService = loginservice
    }
    
    
    func loginUser() async {
        print("Login User started")
        isLoading = true
        errorMessage = nil
         
        defer{isLoading = false}
        
        do{
            let loginRequest = LoginRequest(username:userName, password: password)
            let loginResponse = try await self.loginService.login(req: loginRequest)
            UserDefaultsManager.shared.save(data: loginResponse.token, key:.token)
            isLoginSucceess = true
            print("Login Success:", isLoginSucceess)
       
           
        } catch  let error{
            self.errorMessage = "something went wrong. please try again."
            self.isLoginSucceess = false
            
        }

    }
    

}
