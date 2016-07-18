require 'rails_helper'

RSpec.describe ServerTypesController, type: :controller do

  let(:admin_user) { create(:admin_user) }
  before { sign_in :user, admin_user }

  describe "#check_for_cancel" do
    subject { get :index, cancel: true }

    it "redirects to cancel path" do
      expect(subject).to redirect_to server_types_path
    end
  end

  describe "#index" do
    let!(:server_type) { create(:server_type) }

    context "when sends html request" do
      subject { get :index }
      before { subject }

      it "must create instance variable" do
        expect(assigns(:server_types)).to be_kind_of(ServerType::ActiveRecord_Relation)
      end

      it "render index page" do
        expect(subject).to render_template :index
      end
    end

    context "when sends json request" do
      let(:expected_server_types) do
        server_types = ServerType.select(:id, :name)
        server_types.as_json.each do |s|
          s['DT_RowId'] = s['id']
          s['del']      = "<a href='#{server_type_path(s['id'])}' class='text-danger' data-method='delete'
rel='nofollow' title='Удалить' data-confirm='Вы действительно хотите удалить \"#{s['name']}\"?'><i class='fa
fa-trash-o fa-1g'></a>"
          s.delete('id')
        end
      end
      subject { get :index, format: :json }
      before { subject }

      it "must create instance variable" do
        expect(assigns(:server_types)).to be_kind_of(ServerType::ActiveRecord_Relation)
      end

      it "sends server_types data" do
        parser = JSON.parse(subject.body)
        expect(parser["data"]).to eq expected_server_types.as_json
      end
    end
  end

  describe "#show" do
    context "when sends json request" do
      let!(:server_type) { create(:server_type) }
      let(:expected_server_type) do
        expect_server_type = ServerType.find(server_type.id)
        expect_server_type.as_json(
          include:  {
            template_server_details: {
              only: :count,
              include: { server_part: { only: :name } }
            }
          },
          except: [:id, :created_at, :updated_at]
        )
      end
      subject { get :show, format: :json, id: server_type.id }

      it "sends the server_type data" do
        parser = JSON.parse(subject.body)
        expect(parser).to eq expected_server_type
      end
    end
  end

  describe "#new" do
    subject { get :new }

    context "when sends html request" do
      context "when ServerPart exists" do
        let!(:server_part) { create(:server_part) }

        it "must create a new variable" do
          subject
          expect(assigns(:server_type)).to be_a_new(ServerType)
        end

        it "renders new page" do
          expect(subject).to render_template(:new)
        end
      end

      context "when ServerPart does not exist" do
        it "redirects to index action" do
          expect(subject).to redirect_to action: :index
        end
      end
    end

    context "when sends json request" do
      let!(:server_part) { create(:server_part) }
      let(:server_parts) { ServerPart.select(:id, :name) }
      subject { get :new, format: :json }

      it "sends the all server_types" do
        parser = JSON.parse(subject.body)
        expect(parser).to eq server_parts.as_json
      end
    end
  end

  describe "#create" do
    context "when server_type was created" do
      let(:server_part_1) { create(:server_part) }
      let(:server_part_2) { create(:server_part) }
      let(:server_type) { attributes_for(:server_type, template_server_details_attributes: [
        { id: "", _destroy: "", server_part_id: server_part_1.id, count: 1 },
        { id: "", _destroy: "", server_part_id: server_part_2.id, count: 2 }
      ] ) }

      subject { post :create, server_type: server_type }

      it "changes count of ServerType" do
        expect { subject }.to change { ServerType.count }.by(1)
      end

      it "changes count of TemplateServerDetail" do
        expect { subject }.to change { TemplateServerDetail.count }.by(2)
      end

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end

    context "when server_type was not created" do
      let(:invalid_server_type) { build(:invalid_server_type).attributes }
      subject { post :create, server_type: invalid_server_type }

      it "must not change count of ServerType" do
        expect { subject }.to_not change { ServerType.count }
      end

      it "renders new page" do
        expect(subject).to render_template :new
      end
    end
  end


  describe "#edit" do
    let!(:current_server_type) { create(:server_type) }

    context "when sends html request" do
      subject { get :edit, name: current_server_type.name }
      before { subject }

      it "must create instance variable" do
        expect(assigns(:server_type)).to be_kind_of(ServerType)
      end

      it "check data in instance variable" do
        expect(assigns(:server_type)).to eq current_server_type
      end

      it "render edit page" do
        expect(subject).to render_template :edit
      end
    end

    context "when sends json request" do
      let!(:server_part) { create(:server_part) }
      let(:expected_data) do
        server_details  = current_server_type.template_server_details
        server_parts    = ServerPart.select(:id, :name)
        {
          server_details: server_details.as_json(
            include: { server_part: { only: [:id, :name] } },
            except: [:created_at, :updated_at]
          ),
          server_parts: server_parts
        }
      end
      subject { get :edit, format: :json, name: current_server_type.name }
      before { subject }

      it "sends server_details and server_parts data" do
        parser = JSON.parse(subject.body)
        expect(parser).to eq expected_data.as_json
      end
    end
  end

  describe "#update" do
    let(:server_type_old) { create(:server_type) }

    context "when server_type was updated" do
      let(:server_type_new) { attributes_for(:server_type) }
      subject { put :update, name: server_type_old.name, server_type: server_type_new }

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end

    context "when server_type was not updated" do
      let(:invalid_server_type) { build(:invalid_server_type).attributes }
      subject { put :update, name: server_type_old.name, server_type: invalid_server_type }

      it "renders edit page" do
        expect(subject).to render_template :edit
      end
    end
  end

  describe "#destroy" do
    context "when server_type was destroyed" do
      let!(:server_type) { create(:server_type) }
      subject { delete :destroy, id: server_type.id }

      it "changes count of ServerType" do
        expect { subject }.to change { ServerType.count }.by(-1)
      end

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end
  end

end
