require 'rails_helper'

RSpec.describe "servers/new", type: :view do

  let(:server) { build(:server) }
  before do
    assign(:server, server)
    render
  end

  it "renders form with server action" do
    expect(rendered).to have_selector("form[action='#{servers_path}']")
  end

  it "renders form with post method" do
    expect(rendered).to have_selector("form[method='post']")
  end

  it "renders form with serv_form directive" do
    expect(rendered).to have_selector("form[serv-form='0']")
  end

  it "renders \"ready\" button with name='commit'" do
    expect(rendered).to have_selector("input[name='commit']")
  end

  it "renders \"ready\" button with value='Готово'" do
    expect(rendered).to have_selector("input[value='Готово']")
  end

  it "renders \"cancel\" button with name='cancel'" do
    expect(rendered).to have_selector("button[name='cancel']")
  end

  it "renders \"cancel\" button with value='true'" do
    expect(rendered).to have_selector("button[value='true']")
  end

end

RSpec.describe "servers/new", type: :feature, js: true do

  let(:admin_user) { create(:admin_user) }
  let!(:server_types) { create_list(:server_type, 3) }
  let!(:server_statuses) { create_list(:server_status, 3) }
  before do
    login_as admin_user
    visit new_server_path
  end

  context "when click the cancel button" do
    before { click_button "Отмена" }

    it "redirects to index page" do
      expect(current_path).to eq servers_path
    end
  end

  context "when json response is received" do
    let(:current_status_list) { page.find("select[name='server[server_status_id]']").all("option").map(&:text) }
    let(:expected_status_list) { ["Выберите статус сервера"] }
    subject(:click_status_select) do
      page.find("select[name='server[server_status_id]']").click
      sleep 0.1
    end

    it "creates select field with server_status values" do
      click_status_select
      expected_status_list.concat server_statuses.map(&:name)
      expect(current_status_list).to eq expected_status_list
    end

    let(:current_type_list) { page.find("select[name='server[server_type_id]']").all("option").map(&:text) }
    let(:expected_type_list) { ["Выберите тип сервера"] }
    subject(:click_type_select) do
      page.find("select[name='server[server_type_id]']").click
      sleep 0.1
    end

    it "creates select field with server_type values" do
      click_type_select
      expected_type_list.concat server_types.map(&:name)
      expect(current_type_list).to eq expected_type_list
    end

    context "when selects the server_type field" do
      subject { page.find("select[name='server[server_type_id]'] option[value='#{server_types.first.id}']").select_option }
      let!(:old_count) { page.all(".row", minimum: 2).size }
      before do
        subject
        sleep 0.1
      end

      it "renders a new server_part rows" do
        expect(page.all(".row", minimum: old_count).size).to eq old_count + server_types.first.server_parts.count
      end

      let(:current_hidden_field) { page.all("[data-id='server-structure']").last.all("input[type='hidden']", visible: false).map{ |input| input[:name][/\[id\]$|\[_destroy\]$/] } }

      it "render the hidden field for server_part" do
        expect(current_hidden_field).to match_array(["[id]", "[_destroy]"])
      end

      let(:current_server_part_names) { page.all("[data-id='server-structure']").map{ |row| row.find("select option[selected]").text } }
      let(:expected_server_part_names) { server_types.first.server_parts.map(&:name) }

      it "renders a new server_parts names" do
        expect(current_server_part_names).to eq expected_server_part_names
      end

      let(:current_server_part_counts) { page.all("[data-id='server-structure']").map{ |row| row.find("input[type='text']")[:value].to_i } }
      let(:expected_server_part_counts) { server_types.first.template_server_details.map(&:count) }

      it "renders a new server_parts count" do
        expect(current_server_part_counts).to eq expected_server_part_counts
      end

      context "when click a plus button" do
        before { page.all("button[ng-click='addServPart()']").last.click }
        let(:new_count) { old_count + server_types.first.server_parts.count + 1 }

        it "adds one more row" do
          expect(page).to have_selector(".row", count: new_count)
        end
      end

      context "when click a minus button" do
        before { page.all("button[ng-click='delServPart(detail)']").last.click }
        let(:new_count) { old_count + server_types.first.server_parts.count - 1 }

        it "deletes the row" do
          expect(page).to have_selector(".row", count: new_count)
        end
      end
    end
  end

  context "when sends empty data" do
    before { click_button "Готово" }

    it "renders page with alert" do
      expect(page).to have_selector("div[data-alert]")
    end

    it "renders form with server_types action" do
      expect(page).to have_selector("form[action='#{servers_path}']")
    end

    it "renders form with post method" do
      expect(page).to have_selector("form[method='post']")
    end
  end

end