require 'rails_helper'

RSpec.describe DetailTypesController, type: :controller do

  let(:admin_user) { create(:admin_user) }
  before { sign_in :user, admin_user }

  describe "#check_for_cancel" do
    subject { get :index, cancel: true }

    it "redirects to cancel path" do
      expect(subject).to redirect_to detail_types_path
    end
  end

  describe "#index" do
    subject { get :index }
    before { subject }

    it "must create instance variable" do
     expect(assigns(:detail_types)).to be_kind_of(DetailType::ActiveRecord_Relation)
    end

    it "renders index page" do
      expect(subject).to render_template(:index)
    end
  end

  describe "#new" do
    subject { get :new }

    it "must create a new variable" do
      subject
      expect(assigns(:detail_type)).to be_a_new(DetailType)
    end

    it "renders new page" do
      expect(subject).to render_template(:new)
    end
  end

  describe "#create" do
    context "when detail_type was created" do
      let(:detail_type) { attributes_for(:detail_type) }
      subject { post :create, detail_type: detail_type }

      it "changes count of DetailType" do
        expect { subject }.to change { DetailType.count }.by(1)
      end

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end

    context "when detail_type was not created" do
      let(:invalid_detail_type) { attributes_for(:invalid_detail_type) }
      subject { post :create, detail_type: invalid_detail_type }

      it "must not change count of DetailType" do
        expect { subject }.to_not change { DetailType.count }
      end

      it "renders new page" do
        expect(subject).to render_template :new
      end
    end
  end

  describe "#edit" do
    let(:current_detail_type) { create(:detail_type) }
    subject { get :edit, name: current_detail_type.name }
    before { subject }

    it "must create instance variable" do
      expect(assigns(:detail_type)).to be_kind_of(DetailType)
    end

    it "check data in instance variable" do
      expect(assigns(:detail_type)).to eq current_detail_type
    end

    it "render edit page" do
      expect(subject).to render_template :edit
    end
  end

  describe "#update" do
    let(:detail_type_old) { create(:detail_type) }

    context "when detail_type was updated" do
      let(:detail_type_new) { attributes_for(:detail_type) }
      subject { put :update, name: detail_type_old.name, detail_type: detail_type_new }

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end

    context "when detail_type was not updated" do
      let(:invalid_detail_type) { attributes_for(:invalid_detail_type) }
      subject { put :update, name: detail_type_old.name, detail_type: invalid_detail_type }

      it "renders edit page" do
        expect(subject).to render_template :edit
      end
    end
  end

  describe "#destroy" do
    context "when detail_type was destroyed" do
      let!(:detail_type) { create(:detail_type) }
      subject { delete :destroy, id: detail_type.id }

      it "changes count of DetailType" do
        expect { subject }.to change { DetailType.count }.by(-1)
      end

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end
  end

end
