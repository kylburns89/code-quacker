
import React from 'react';
import Layout from '../components/Layout';
import Duck from '../components/Duck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Code, Lightbulb, MessageSquare } from 'lucide-react';

const About: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Duck size="lg" animate={true} className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">About RubberDuck</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Your AI-powered rubber duck debugging assistant to help you solve coding problems
            through thoughtful conversation.
          </p>
        </div>
        
        <Card className="mb-8 glass overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle>What is Rubber Duck Debugging?</CardTitle>
            <CardDescription>
              A tried and true method for problem-solving in software development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Rubber duck debugging is a method of debugging code by explaining it line-by-line
              to an inanimate object, like a rubber duck. By verbalizing the problem, developers
              often discover the solution on their own.
            </p>
            <p>
              This technique works because explaining a problem forces you to articulate it clearly,
              which helps identify inconsistencies in your logic or understanding that you might have
              overlooked when the problem was just a vague concept in your mind.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI-Powered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                RubberDuck uses Google's Gemini AI to provide intelligent responses and guide you
                through solving your coding challenges.
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Code-Focused
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Explain your code problems in detail, and receive insights tailored to programming
                and development challenges.
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Insight-Driven
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Rather than just providing answers, RubberDuck helps you think through problems
                by asking the right questions.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mb-8 glass">
          <CardHeader>
            <CardTitle>How to Use RubberDuck</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h3 className="font-medium mb-1">Set up your Gemini API key</h3>
                <p className="text-muted-foreground text-sm">
                  Enter your Google Gemini API key when prompted to enable the AI features.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <h3 className="font-medium mb-1">Explain your problem</h3>
                <p className="text-muted-foreground text-sm">
                  Clearly describe the issue you're facing, including relevant code snippets and error messages.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <h3 className="font-medium mb-1">Engage in conversation</h3>
                <p className="text-muted-foreground text-sm">
                  Answer RubberDuck's questions and follow its guidance to explore your problem from different angles.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">4</span>
              </div>
              <div>
                <h3 className="font-medium mb-1">Find your solution</h3>
                <p className="text-muted-foreground text-sm">
                  Through the process of explanation and discussion, you'll often discover the solution yourself!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-12 mb-8">
          <p className="text-muted-foreground">
            RubberDuck is an open-source project built with React, TypeScript, and TailwindCSS.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default About;
